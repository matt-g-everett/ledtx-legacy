const coap = require('coap');
const protobuf = require('protobufjs');
const Readable = require('stream').Readable;

const RX_HOST = 'localhost';

const root = protobuf.loadSync('./modules/ledapi/protobuf/coapapi.proto');
const Config = root.lookupType('Config');
const FrameSet = root.lookupType('FrameSet');
const Mode = root.lookupEnum('Config.Mode');

function off() {
    const coap_payload = {
        mode: Mode.values.OFF
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

    req.on('response', res => {
        console.log(`Response received, code: ${res.code}.`);
        process.exit(0);
    });
}

off();


setTimeout(() => {
    console.log('Timed-out');
}, 2000);
