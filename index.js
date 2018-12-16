const bluebird = require('bluebird');
const coap = require('coap');
const CoapRouter = require('coap-router');
const express = require('express');
const protobuf = require('protobufjs');
const Readable = require('stream').Readable;
const request = require('request');

const HTTP_PORT = 3000;
const COAP_PORT = 5683;
const LED_COUNT = 350;
const TX_HOST = 'localhost';
const RX_HOST = '192.168.1.40';

const httpApp = express();
const coapApp = CoapRouter();
const coapServer = coap.createServer(coapApp);

const root = protobuf.loadSync('./modules/ledapi/protobuf/coapapi.proto');
const Config = root.lookupType('Config');
const FrameSet = root.lookupType('FrameSet');
const Mode = root.lookupEnum('Config.Mode');

const mode_mapping = {
    'off': Mode.values.OFF,
    'fixedFrame': Mode.values.FIXED_FRAME,
    'swishRainbow': Mode.values.SWISH_RAINBOW
};

coapApp.put("/config", (req, res) => {
    const decoded = Config.decode(req.payload);
    err = Config.verify(decoded);
    if (err) {
        throw Error('Config not verified.')
    }
    console.log('Recieved CoAP payload.');
    res.end();
});

coapApp.get("/frames", (req, res) => {
    const frameData = Buffer.alloc(LED_COUNT * 3);
    const payload = {
        frames: [frameData]
    }

    const message = Config.create(payload);
    const buffer = Config.encode(message).finish();
});

httpApp.use(express.json());

httpApp.put('/api/config', (req, res) => {
    if (req.body.mode == 'fixedFrame') {
        const frameData = Buffer.alloc(LED_COUNT * 3);
        if (req.body.fixedFrame.frameData.length > LED_COUNT) {
            throw new Error('Too many pixels in frameData.');
        }

        req.body.fixedFrame.frameData.forEach((element, i) => {
            let masked,
                index = i * 3;

            masked = (element & 0xFF0000) >> 16;
            frameData[index++] = Math.max(Math.min(masked, 80), 0);
            masked = (element & 0x00FF00) >> 8;
            frameData[index++] = Math.max(Math.min(masked, 80), 0);
            masked = element & 0xFF;
            frameData[index] = Math.max(Math.min(masked, 80), 0);
        });

        const coap_payload = {
            mode: mode_mapping[req.body.mode],
            fixedFrame: {
                frameData: frameData
            }
        };

        const message = Config.create(coap_payload);
        const buffer = Config.encode(message).finish();

        var req = coap.request({
            hostname: RX_HOST,
            method: 'PUT',
            pathname: '/config'
        });
    
        // Pipe the JSON payload into the HTTP request
        const s = new Readable();
        s.push(buffer);
        s.push(null);
        s.pipe(req);
        req.on('response', function(res) {
            console.log(res.payload.toString('utf8'));
            res.on('end', function() {
                console.log('done sending request.');
            });
        })
    }
    
    res.send();
});

function testHttpConfig() {
    const example_request = {
        "mode": "fixedFrame",
        "fixedFrame": {
            "frameData": [ 20, 0, 20, 0, 20, 0, 20]
        }
    }
    const s = new Readable();
    s.push(JSON.stringify(example_request));
    s.push(null);
    
    const options = {
        'url': `http://${TX_HOST}:${HTTP_PORT}/api/config`,
        'headers': {
            'Content-Type': 'application/json'
        }         
    }
    s.pipe(request.put(options, (req, res) => {
        res.pipe(process.stdout);
    }));
}

httpApp.listen(HTTP_PORT, () => {
    console.log(`HTTP server listening on port ${HTTP_PORT}.`);
    coapServer.listen(COAP_PORT, () => {
        console.log(`CoAP server listening on port ${COAP_PORT}.`);
        testHttpConfig();
    });
});
