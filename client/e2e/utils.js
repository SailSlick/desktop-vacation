// Part of the boilerplate. Makes writing e2e tests easier

import electron from 'electron';
import { Application } from 'spectron';

function beforeEach() {
    this.timeout(10000);
    this.app = new Application({
        path: electron,
        args: ['.'],
        startTimeout: 10000,
        waitTimeout: 10000
    });
    return this.app.start();
}

function afterEach() {
    this.timeout(10000);
    if (this.app && this.app.isRunning()) {
        return this.app.stop();
    }
}

export default {
    beforeEach,
    afterEach
}
