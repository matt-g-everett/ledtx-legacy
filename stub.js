const bluebird = require('bluebird');
const coap = require('coap');
const CoapRouter = require('coap-router');
const express = require('express');
const protobuf = require('protobufjs');
const Readable = require('stream').Readable;
const request = require('request');

const COAP_PORT = 5683;
const LED_COUNT = 350;

const coapApp = CoapRouter();
const coapServer = coap.createServer(coapApp);

const root = protobuf.loadSync('./modules/ledapi/protobuf/coapapi.proto');
const Config = root.lookupType('Config');

coapApp.put("/config", (req, res) => {
    const decoded = Config.decode(req.payload);
    err = Config.verify(decoded);
    if (err) {
        throw Error('Config not verified.')
    }
    console.log('Received CoAP payload.');
    res.statusCode = 204;
    res.end("Done");
});

coapServer.listen(COAP_PORT, () => {
    console.log(`CoAP server listening on port ${COAP_PORT}.`);
});
