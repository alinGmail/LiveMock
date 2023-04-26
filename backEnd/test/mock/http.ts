import typeis from "type-is";
import express from "express";

import httpMocks from "node-mocks-http"
import FormData from "form-data";
function createMockRequest(customProperties = {}) {
    const defaultProperties = {
        method: 'GET',
        url: '/',
        headers: {},
        query: {},
        params: {},
        body: {},
        get: function(header) {
            return this.headers[header.toLowerCase()];
        }
    };

    return Object.assign(defaultProperties, customProperties);
}
const form = new FormData();
form.append('field1', 'value1');
// 将 FormData 序列化为 Buffer 对象
const formBuffer = form.getBuffer();

const mockRequest = httpMocks.createRequest({
    method: 'POST',
    url: '/api/v1/upload',
    headers: {
        ...form.getHeaders(), // 添加正确的 Content-Type 和 boundary
        "content-length": formBuffer.length + ''
    },
    body: formBuffer
});

console.log('Mock request:', mockRequest);

const result = typeis.hasBody(mockRequest);
console.log('type-is result:', result);