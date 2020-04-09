/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Pedro Barreto <pedrob@crosslaketech.com>
 - Rajiv Mothilal <rajivmothilal@gmail.com>
 - Miguel de Barros <miguel.debarros@modusbox.com>
 - Shashikant Hirugade <shashikant.hirugade@modusbox.com>

 --------------
 ******/

'use strict'

import client = require('prom-client')
import { throws } from 'assert'

/**
 * Type that represents the options that are required for setup
 */
type metricOptionsType = {
    timeout: number,
    prefix: string,
    defaultLabels?: Map<string, string>,
    register?: client.Registry
}

/**
 * Type that represents the options that are required to setup the prom-client specifically
 */
type normalisedMetricOptionsType = {
    timeout: number,
    prefix: string
}

/**
 * Object that holds the histogram values
 */
// Required for Prom-Client v12.x 
// type histogramsType = { [key: string]: client.Histogram<string> }
// type summariesType = { [key: string]: client.Summary<string> }

// Required for Prom-Client v11.5.x 
type histogramsType = { [key: string]: client.Histogram }
type summariesType = { [key: string]: client.Summary }

/** Wrapper class for prom-client. */
class Metrics {
    /** To make sure the setup is run only once */
    private _alreadySetup: boolean = false

    /** The options passed to the setup */
    private _options: metricOptionsType = { prefix: '', timeout: 0 }

    /** Object containing the default registry */
    private _register: client.Registry = client.register

    /** Object containing the histogram values */
    private _histograms: histogramsType = {}

    /** Object containing the summaries values */
    private _summaries: summariesType = {}

    /**
     * Setup the prom client for collecting metrics using the options passed
     */
    setup = (options: metricOptionsType): boolean => {
        if (this._alreadySetup) {
            client.AggregatorRegistry.setRegistries(this.getDefaultRegister())
            return false
        }
        this._options = options
        // map the options to the normalised options specific to the prom-client
        let normalisedOptions: normalisedMetricOptionsType = {
            prefix: this._options.prefix,
            timeout: this._options.timeout
        }
        if(this._options.defaultLabels !== undefined){
            client.register.setDefaultLabels(this._options.defaultLabels)
        }

        // configure detault metrics
        client.collectDefaultMetrics(normalisedOptions)

        // set default registry
        // client.AggregatorRegistry.setRegistries(this.getDefaultRegister())        
        this._register = client.register

        // set setup flag
        this._alreadySetup = true

        // return true if we are setup
        return true
    }

    /**
     * Get the histogram values for given name
     */
    // getHistogram = (name: string, help?: string, labelNames?: string[], buckets: number[] = [0.010, 0.050, 0.1, 0.5, 1, 2, 5]): client.Histogram<string> => { // <-- required for Prom-Client v12.x
    getHistogram = (name: string, help?: string, labelNames?: string[], buckets: number[] = [0.010, 0.050, 0.1, 0.5, 1, 2, 5]): client.Histogram => { // <-- required for Prom-Client v11.x
        try {
            if (this._histograms[name]) {
                return this._histograms[name]
            }
            this._histograms[name] = new client.Histogram({
                name: `${this.getOptions().prefix}${name}`,
                help: help || `${name}_histogram`,
                labelNames,
                buckets // this is in seconds - the startTimer().end() collects in seconds with ms precision
            })
            return this._histograms[name]
        } catch (e) {
            throw new Error(`Couldn't get metrics histogram for ${name}`)
        }
    }

    /**
     * Get the summary for given name   
     */
    // getSummary = (name: string, help?: string, labelNames?: string[], percentiles: number[] = [ 0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999], maxAgeSeconds: number = 600, ageBuckets: number = 5): client.Summary<string> => { // <-- required for Prom-Client v12.x
    getSummary = (name: string, help?: string, labelNames?: string[], percentiles: number[] = [ 0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999], maxAgeSeconds: number = 600, ageBuckets: number = 5): client.Summary => { // <-- required for Prom-Client v11.x
        try {
            if (this._summaries[name]) {
                return this._summaries[name]
            }
            this._summaries[name] = new client.Summary({
                name: `${this.getOptions().prefix}${name}`,
                help: help || `${name}_summary`,
                labelNames,
                maxAgeSeconds,
                percentiles,
                ageBuckets
            })
            return this._summaries[name]
        } catch (e) {
            throw new Error(`Couldn't get summary for ${name}`)
        }
    }
    /**
     * Get the metrics
     */
    getMetricsForPrometheus = (): string => {
        return client.register.metrics()
    }

    /**
     * Get the options that are used to setup the prom-client
     */
    getOptions = (): metricOptionsType => {
        return this._options
    }

    /**
     * To check is it the Metrics already initiated
     */
    isInitiated = (): boolean => {
        return this._alreadySetup
    }

    getDefaultRegister = (): client.Registry => {
        return this._register
    }
}

export {
    Metrics,
    metricOptionsType
}
