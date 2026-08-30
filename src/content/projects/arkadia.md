---
title: "Arkadia: an event-driven home environment monitor"
meta_title: "Arkadia - Event-Driven Home Environment Monitoring"
description: "Building a home climate, air quality, and live audio monitor on a Raspberry Pi with MQTT, FastAPI, and WebSockets."
date: 2026-08-26T05:00:00Z
image: "/images/arkadia-architecture.png"
categories: ["IoT", "Hardware", "Software Engineering"]
author: "Michael Alonge"
tags: ["python", "raspberry-pi", "mqtt", "mosquitto", "fastapi", "websockets", "svelte", "numpy", "fft", "systemd", "i2c", "i2s", "pydantic"]
draft: false
---

Arkadia is a home environment monitoring system I built for a mix of personal and professional reasons. Firstly, I wanted a system of my own for monitoring indoor climate and air quality in Los Angeles, which is prone to heat waves and wildfires. I also wanted experience with edge and IoT software engineering. Most of my professional work is in the cloud, and this was an opportunity to work closer to the hardware. Finally, I am a musician and I am interested in guitar audio signal processing. Integrating a microphone into the system lets me monitor noise levels to protect my ears and visualizing the sound in the room as it happens helps me learn more about audio processing.

A typical hobby environment monitor connects everything directly: one Python script reads the sensors in sequence, bundles the readings, and writes them to a display. But that approach is brittle. If one sensor is down, or you want to add a new one, or you want to show or analyze the data differently, even a small change impacts the whole program. Once I decided to build this, I wanted to build it the way I would build something at work, so that I could keep extending it and so that I would get real practice with the concepts I use professionally.

The project is named after the Skaikru base camp in book and TV series *The 100*.

## What I built, from the top down

All the code for the project is on GitHub at [malonge/Arkadia](https://github.com/malonge/Arkadia).

At the top of the stack is a web dashboard as a single place to monitor all of the sensors and the current state of my home environment. I went with a lo-fi analog look because, for whatever reason, I wanted to feel like I was sitting in the control room of an old nuclear plant. There are three panels. Climate shows temperature as a block gauge, along with humidity and pressure. Air quality shows a CO₂ bar, a VOC indicator that changes color along the scale, and a second temperature and humidity reading from the CO₂ sensor. Audio is my favorite part of the dashboard, and the one that is truly live: an eight-band EQ, a waveform, and a rolling average of the room's sound level. The dashboard also provides indicators for sensor health and timing.

![The Arkadia dashboard](/images/arkadia-dashboard.png)

The UI is still pretty crude, but it gives a good idea of the direction I would go as I add more sensors and clean up the system. Long term, I would rather display the information on an LED matrix than a web page.

The API is a systemd service that starts when the Raspberry Pi boots. It serves the dashboard on port 8000, which can be reached from any device on the local network, and exposes the data under `/api`. REST endpoints return the latest reading for each sensor, and the dashboard polls those. The EQ and waveform need a continuous stream, so those come over a WebSocket. The API does not talk to the sensors directly. It reads from a local Mosquitto broker that the rest of the system publishes to.

Each sensor has its own process. That process reads from the hardware, does any quality checks or aggregation the sensor needs, and publishes to the broker.

At the bottom of the stack is the circuit with four sensors so far:

- BME280 — temperature, humidity, and barometric pressure. I2C, address `0x76`.
- SCD40 — CO₂, temperature, and humidity. I2C, address `0x62`.
- SGP40 — volatile organic compounds as a single VOC Index. I2C, address `0x59`.
- INMP441 — an I2S MEMS microphone.

<figure class="flex flex-col items-center">
  <img class="!mx-auto !w-[360px]" src="/images/arkadia-breadboard.jpg" alt="The Raspberry Pi connected to a breadboard with the BME280, SCD40, and INMP441" />
  <figcaption>The Pi and breadboard, photographed before I added the SGP40. The BME280 and SCD40 are connected to the same I2C bus on the bottom left. The INMP441 is connected to the I2S bus in the center.</figcaption>
</figure>

Power and ground feed the breadboard rails from the Pi. The BME280, SCD40, and SGP40 all use I2C, so they share SDA and SCL, the physical pins 3 and 5 on the header (GPIO 2 and 3). The INMP441 uses I2S: bit clock on GPIO 18, word select on GPIO 19, and data out on GPIO 20.

## Technical Deep Dive

Now that you have a high-level overview of the project, let's dive into some of the technical details.

### Event-driven architecture with MQTT

The core of the software is a Mosquitto MQTT broker on the Pi. Sensor services publish readings to the broker on dedicated topics and other services (like the API) subscribe.

The main benefit is separation of concerns. Each sensor has its own process and its own place on the bus. That process has one job: read the sensor, do a minimal amount of processing, and publish. It does not need to know how the other sensors work, or whether they are up, or how the data will be used. This separation of concerns has already proven useful. I have a hardware problem with the SGP40 right now, and while I debug it the rest of Arkadia keeps running and the dashboard marks that one panel as offline. Aside from helping to mitigate existing bugs, this separation of concerns makes it easier to add new sensors or displays in the future.

The bus carries two kinds of data: telemetry and live streaming. Temperature, CO₂, VOC, and the periodic decibel reading are telemetry: sampled every few seconds or every minute, where only the most recent value matters. The live audio signal for the equalizer is real-time and has to be processed as it arrives. The same broker handles both, but not in the same way.

Telemetry data is published with `retain=true`, so the broker holds the most recent reading for each sensor. When the API restarts, the broker replays those retained messages and the API rebuilds its state immediately. The audio stream on the other hand is published at QoS 0 with no retain.

```python
# Telemetry: guaranteed delivery, broker holds the latest value.
client.publish(summary_topic, summary_payload.model_dump_json(), qos=1, retain=True)

# Live audio: fire and forget, nothing kept.
client.publish(stream_topic, stream_payload.model_dump_json(), qos=0, retain=False)
```

I used hierarchical topics and wildcard subscriptions for easy extensibility. Topics are namespaced as `home/sensors/{category}/{sensor_id}`, and the API subscribes once to `home/sensors/#`. A new sensor shows up on the bus and the API picks it up without a configuration change.

I used a Last Will and Testament to let the broker report a failures. Each service registers a will when it connects, so if it disconnects ungracefully the broker publishes `{"status": "offline"}` to `home/status/{sensor_id}` on its behalf. The sensor health indicators on the dashboard use this feature directly.

Comparing Mosquito/MQTT to other options, Redis pub/sub is fire-and-forget with no per-topic retention and no will. ZeroMQ is brokerless, so there is no last-value cache and no liveness signal unless you build them.

### Schemas and contracts

The bus decouples producers from consumers, and while this underpins the extensibility and resiliency of the system, it also means the various system components need to be strict about data schemas and contracts. Every reading goes out in the same envelope: a schema version, the sensor's identity, a UTC timestamp, the values, metadata about how those values were produced, and optional service diagnostics.

```json
{
  "schema_version": 1,
  "sensor_id": "bme280",
  "timestamp": "2026-05-08T14:23:01Z",
  "readings": {
    "temperature_c": 21.4,
    "humidity_pct": 43.2,
    "pressure_hpa": 1013.6
  },
  "meta": {
    "sample_count": 5,
    "aggregation": "median"
  },
  "diagnostics": {
    "uptime_seconds": 12345,
    "read_failures": 0
  }
}
```

The envelope and every sensor's readings are defined as Pydantic models in a shared `common` package that all the services import, so the contract is enforced at both ends.

The `meta` section of the schema documents any aggregation or transformation that the producer does. The sensors are fallible, and this raises an interesting and common software design question: who is responsible for data processing steps? To answer this question, we can use a simple heuristic: if a data processing step is generally applicable, it should be done by the producer. For example, no consuming service is ever likely to care about implausibly low or high temperature readings. Therefore, it's cleaner for the producer to take several readings and publish the median, rather than having every consumer deal with implausible values in repetitive and heterogeneous ways. On the other hand, if a data processing step is specific to a consumer, it should be done by that consumer. For example, converting units or displaying trends in the data is likely to be specific to a given consumer, so they should own it.

### The REST API

It would be inconvenient, and usually brittle, to have every consumer read from the broker directly. So there is a FastAPI service between the bus and outside clients.

Beyond a normal HTTP interface, it does two things. First, it owns the business logic that every consumer should share but that is too high level to be done by the producers. For example, the API is where a sensor is treated as missing when nothing has ever arrived, and where a reading is marked stale when the newest one is too old.

Second, it is the security boundary. Mosquitto listens only on `127.0.0.1`, so nothing on the network can reach MQTT at all. Outside consumers go through the API, which requires a key, as does the audio socket. This is a local, single-device deployment on a trusted network, so there is no TLS. If I ever exposed the API beyond the LAN, that would have to change, but only in one place.

### Real-time audio

Most of the above is telemetry, which is familiar from my usual work. The live audio path was newer for me, and it speaks to my musical side. By integrating live audio into the monitor I can visualize the sound in the room as it happens. This feature is more about hobbies than health monitoring. For ear health, telemetry oriented data from the microphone is sufficient (e.g. decibel levels over time). But I figured since I needed to hook up a microphone to the Pi anyways, I might as well cover real-time audio as well and have some fun.

<div class="notice note">
  <div class="notice-head">
    <p class="my-0"></p>
  </div>
  <div class="notice-body">
    <p>You cannot get more "real time" than a fully analog path. I would like to build an analog waveform and graphic EQ someday that I can plug a guitar or a record player into. But Arkadia is digital and this writeup is about software.</p>
  </div>
</div>

The INMP441 turns incoming sound into a digital sample stream. The service captures that stream in fixed windows, and each window is one self-contained frame of work. The waveform panel draws the window directly as amplitude over time. The same window, run through a Fast Fourier Transform, becomes a set of frequency components, which are grouped into eight octave bands and drawn as a graphic equalizer — essentially a histogram over frequency. Here is the core of it:

```python
windowed = waveform * window          # Hann window, reduces spectral leakage
spectrum = np.fft.rfft(windowed)

# Normalise so a full-scale sine wave lands at 0 dBFS.
mags = np.abs(spectrum) / (window_size / 2.0)
mags_db = 20.0 * np.log10(np.clip(mags, 1e-10, None))
```

Aggregating those bins into bands took more care than I expected. Each ISO 266 octave band spans from its centre frequency divided by √2 to its centre times √2. The subtlety is that you cannot average decibels directly. They are logarithmic, so the arithmetic mean of a set of dB values is not the level of their combined energy. The bins have to be converted back to linear power, averaged there, and converted again:

```python
for centre in bands_hz:
    low, high = centre / sqrt2, centre * sqrt2
    mask = (freqs >= low) & (freqs < high)

    if mask.any():
        linear = 10.0 ** (mags_db[mask] / 20.0)
        mean_linear = float(np.mean(linear))
        levels_db.append(20.0 * math.log10(max(mean_linear, 1e-10)))
    else:
        levels_db.append(_DB_FLOOR)
```

#### The latency budget

The two parameters that matter are the sample rate and the window size: 48 kHz and 2,400 samples. They set everything else. A 2,400-sample window is exactly 50 ms of sound, which means frames come out at 20 Hz, and the FFT produces 1,201 bins spanning 0 Hz to Nyquist at 24 kHz, spaced 20 Hz apart.

It also means the window is the floor on latency. You have to collect 50 ms of sound before you can transform any of it, so every frame the browser draws describes a slice of time that ended at least 50 ms ago. That is a property of the design rather than a performance problem, and it is the number worth knowing.

Everything after that is cheap by comparison. A 2,400-point real FFT is on the order of *N* log₂ *N* ≈ 27,000 operations, which NumPy does in microseconds against a 50 ms budget. So the window size is really a resolution tradeoff and not a compute one. A longer window would buy finer frequency resolution and a slower, laggier display, and a shorter one the reverse.

#### What I would change

I had to decide whether the live path should use the same broker as the telemetry, or whether consumers should read it some other way. I kept it on the bus. It is simpler, and it preserves the pattern. I still think that was right, but it is the weakest part of the design, and the reason is payload size.

Every frame carries the full waveform, the full spectrum, and the eight computed bands. Serialized as JSON that is about 85 KB per frame, or roughly 1.7 MB/s if you leave it running. Two things stand out in the breakdown. The bin frequency array is a fixed function of sample rate and window size, so it is identical in every frame, and I retransmit it twenty times a second. And the equalizer, which is what the panel actually renders, needs 231 bytes of that 85 KB. The full spectrum is on the frame in case I want it later, but nothing consumes it today.

This is also where MQTT's fit gets loose. It was built to move small messages over unreliable links, and I am pushing 85 KB frames across loopback. It works, and nobody notices on a wired local system, but the protocol is not earning much here. Dropping the spectrum from the frame, or moving the stream to a binary encoding, is the first thing I would change.

#### Streams and snapshots

The live frames also go through FastAPI, but not as REST. REST is a request for the latest value. This is a stream, so the API holds a WebSocket open and pushes frames as they arrive. That is async, and it can keep more than one client connected. Getting the frames there took some care, because MQTT callbacks fire on the paho client's background thread while WebSocket sends have to happen on the asyncio event loop:

```python
def broadcast(self, data: str) -> None:
    """Send *data* to all connected clients from any thread."""
    if self._loop is None or not self._connections:
        return

    with self._lock:
        connections = set(self._connections)

    async def _send_all() -> None:
        dead: set[WebSocket] = set()
        for ws in connections:
            try:
                await ws.send_text(data)
            except Exception:
                dead.add(ws)
        if dead:
            with self._lock:
                self._connections -= dead

    asyncio.run_coroutine_threadsafe(_send_all(), self._loop)
```

The frontend has to respect that same split. If I polled the live frames, I would turn a stream back into a snapshot and add another delay. If I pushed temperature over a socket, I would be building a live path for data that only changes every minute. So the page uses both. The audio panel makes the distinction obvious: the waveform and the equalizer come from the socket; the rolling decibel number does not. That number is a short-window summary. It has the same meaning as the other telemetry, so it uses the same poll.

I also did not want the browser to become a second signal processor. The FFT already ran on the Pi. If each client redid it, every consumer could disagree about the bands, and a cheap display would pay for work it does not need. The page only draws.

#### Two display problems

Two problems showed up that are not data problems. Room level is low, so a faithful plot of the waveform sits on the baseline. I amplify it in the drawing, not in the numbers. The bands also move faster than you can read, so the EQ keeps a short peak hold that decays at 18 dB per second.

```js
function levelToBlocks(db) {
  // Apply gain (dB boost) for display height only.
  const boosted = Math.min(0, db + gain);
  const ratio   = Math.max(0, Math.min(1, (boosted - FLOOR_DB) / -FLOOR_DB));
  return Math.round(ratio * BLOCKS);
}
```

In both cases the payload stays in dBFS and the adjustment happens in the drawing code, past every interface. The canvas is allowed to lie a little so you can see what is happening.

The last issue is what to show when the socket dies. A retained last frame would look live when it is not. The drawings go idle instead, and the client reconnects. That is the same reason the live topic on the broker does not keep a last value.

### Coding with AI

Just as in my current setup at work, I built everything via Cursor Cloud using Claude Opus. To test and deploy the code, I pulled from the relevant GitHub branch directly on the Raspberry Pi. No code was actually written on the Pi.

With agents writing most or all of the code for new projects like this, it is very important for me as the engineer to lay out the vision and the technical design clearly. So the first thing in the repo was not code. It was a technical design document, followed by a plan that broke the work into sequenced pull requests with acceptance criteria for each. The design doc opens with the principles that everything else had to follow:

```markdown
## Design Philosophy

- Simple and correct over clever.
- Each process has a single responsibility.
- Services fail fast on startup errors.
- systemd handles process supervision and restart.
- Configuration lives outside of code.
- All inter-process communication is local to the Raspberry Pi.
- Adding a new sensor requires minimal changes.
```

Those seven lines did a lot of work. "Each process has a single responsibility" is why there are four sensor services instead of one loop. "Services fail fast on startup errors" plus "systemd handles process supervision" is why no service contains retry logic for its own initialization; it exits, and systemd restarts it. When the agent had a decision to make that I had not anticipated, those lines usually answered it, and I think that is why the implementation went mostly on autopilot.

The friction came from the physical side instead. The `googlevoicehat-soundcard` ALSA driver on the Pi 5 requires 48 kHz stereo capture and will not do 16 kHz, so I did not choose my sample rate. The driver did, and the design had to move to meet it. The INMP441 is a mono microphone, but the driver presents it as stereo, and which channel carries the signal depends on whether you tied the L/R pin to ground or to 3.3 V. Then `sounddevice` turned out to be unable to negotiate hardware parameters through the ALSA software volume layer, so the service has to address the hardware device directly.

The systemd configuration also took a few rounds, mostly around environment variables and permissions. The audio service needs `Group=audio` for ALSA access, and `ExecStart` ends up shelling through bash so that a path variable from the environment file expands:

```ini
[Service]
User=pi
Group=audio
EnvironmentFile=/etc/home-monitor.env
ExecStart=/bin/bash -c \
  'exec "${ARKADIA_ROOT}/services/audio/.venv/bin/python" \
        "${ARKADIA_ROOT}/services/audio/main.py"'
Restart=on-failure
RestartSec=5
```

None of that is difficult, but each round trip means pushing a branch, pulling it on the Pi, restarting the unit, and reading the journal. When things are in the cloud I automate that loop without thinking about it. Here I could not, and I also had to take care of the hardware physically. That was a good reminder of how much of my normal speed comes from infrastructure I do not have to think about.

## Conclusion

Arkadia is a living project that combines my professional software engineering interests with personal hobbies like electronics and music. I say "living" because it is not just a single collection of sensors. It is a platform for environment monitoring that supports extension and customization.

I was able to make a hobby system this flexible because of software concepts from my career. Event-driven architecture, separation of concerns, and clear contracts between services are what keep Arkadia running smoothly and what separate it from a typical hobby project. This was a chance to apply those tried and true principles in a setting outside of work.

Beyond getting reps with familiar concepts, I am most pleased with the new skills Arkadia provided, primarily using WebSockets for real-time data streaming. That framing between old and new skills has implications for coding with AI. In my experience, the role of an engineer is less and less about writing the actual code and more and more about design. The first thing I committed to the repo was a technical design and a development plan drawing on those foundational principles, and that enabled the agent to code mostly on autopilot. But the agent still had to contribute to the design around live streaming. Since that was new for me and came more from the agent than from me, I found it important to review and internalize that code more than other parts of the codebase, so I would actually acquire the skill rather than hand-waving and deferring. The next time I encounter a similar live streaming application at work or in a personal project, I should be able to provide more of a vision from the start.

Next on my list of enhancements is something like a PMS5003 to measure particulates. That would probably be the most helpful sensor for air quality during a wildfire, which was my original motivation for building Arkadia. After that, more in the spirit of the real-time audio and as an attempt to cover more of the human senses, it would be fun to incorporate optical sensors such as a VEML7700 and an AS7341 to report the intensity and composition of ambient light. I also want to extend the consumer side — an LED matrix as a physical monitor, rather than relying only on the web app.

<video controls preload="metadata" width="1280" height="720" class="w-full rounded">
  <source src="/videos/arkadia-audio.mp4" type="video/mp4" />
  A screen capture of the Arkadia audio panel responding to sound in the room.
</video>
