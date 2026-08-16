/* @ts-self-types="./mission_simulator.d.ts" */

export class CredentialCompromiseOutput {
    static __wrap(ptr) {
        const obj = Object.create(CredentialCompromiseOutput.prototype);
        obj.__wbg_ptr = ptr;
        CredentialCompromiseOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CredentialCompromiseOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_credentialcompromiseoutput_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get blast_radius_score() {
        const ret = wasm.__wbg_get_credentialcompromiseoutput_blast_radius_score(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get reliability_delta() {
        const ret = wasm.__wbg_get_credentialcompromiseoutput_reliability_delta(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get residual_exposure_score() {
        const ret = wasm.__wbg_get_credentialcompromiseoutput_residual_exposure_score(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set blast_radius_score(arg0) {
        wasm.__wbg_set_credentialcompromiseoutput_blast_radius_score(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set reliability_delta(arg0) {
        wasm.__wbg_set_credentialcompromiseoutput_reliability_delta(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set residual_exposure_score(arg0) {
        wasm.__wbg_set_credentialcompromiseoutput_residual_exposure_score(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) CredentialCompromiseOutput.prototype[Symbol.dispose] = CredentialCompromiseOutput.prototype.free;

export class DeploymentFailureOutput {
    static __wrap(ptr) {
        const obj = Object.create(DeploymentFailureOutput.prototype);
        obj.__wbg_ptr = ptr;
        DeploymentFailureOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DeploymentFailureOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_deploymentfailureoutput_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get diagnosis_confidence_pct() {
        const ret = wasm.__wbg_get_deploymentfailureoutput_diagnosis_confidence_pct(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get estimated_hours_to_root_cause() {
        const ret = wasm.__wbg_get_deploymentfailureoutput_estimated_hours_to_root_cause(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get reliability_delta() {
        const ret = wasm.__wbg_get_deploymentfailureoutput_reliability_delta(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set diagnosis_confidence_pct(arg0) {
        wasm.__wbg_set_deploymentfailureoutput_diagnosis_confidence_pct(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set estimated_hours_to_root_cause(arg0) {
        wasm.__wbg_set_deploymentfailureoutput_estimated_hours_to_root_cause(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set reliability_delta(arg0) {
        wasm.__wbg_set_deploymentfailureoutput_reliability_delta(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) DeploymentFailureOutput.prototype[Symbol.dispose] = DeploymentFailureOutput.prototype.free;

export class RecoveryDecisionOutput {
    static __wrap(ptr) {
        const obj = Object.create(RecoveryDecisionOutput.prototype);
        obj.__wbg_ptr = ptr;
        RecoveryDecisionOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RecoveryDecisionOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_recoverydecisionoutput_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get estimated_minutes_to_restore() {
        const ret = wasm.__wbg_get_recoverydecisionoutput_estimated_minutes_to_restore(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get reliability_delta() {
        const ret = wasm.__wbg_get_recoverydecisionoutput_reliability_delta(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get second_incident_risk_pct() {
        const ret = wasm.__wbg_get_recoverydecisionoutput_second_incident_risk_pct(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set estimated_minutes_to_restore(arg0) {
        wasm.__wbg_set_recoverydecisionoutput_estimated_minutes_to_restore(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set reliability_delta(arg0) {
        wasm.__wbg_set_recoverydecisionoutput_reliability_delta(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set second_incident_risk_pct(arg0) {
        wasm.__wbg_set_recoverydecisionoutput_second_incident_risk_pct(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) RecoveryDecisionOutput.prototype[Symbol.dispose] = RecoveryDecisionOutput.prototype.free;

export class ServiceDegradationOutput {
    static __wrap(ptr) {
        const obj = Object.create(ServiceDegradationOutput.prototype);
        obj.__wbg_ptr = ptr;
        ServiceDegradationOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ServiceDegradationOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_servicedegradationoutput_free(ptr, 0);
    }
    /**
     * @returns {boolean}
     */
    get database_is_likely_cause() {
        const ret = wasm.__wbg_get_servicedegradationoutput_database_is_likely_cause(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    get projected_latency_ms() {
        const ret = wasm.__wbg_get_servicedegradationoutput_projected_latency_ms(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get reliability_delta() {
        const ret = wasm.__wbg_get_servicedegradationoutput_reliability_delta(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {boolean} arg0
     */
    set database_is_likely_cause(arg0) {
        wasm.__wbg_set_servicedegradationoutput_database_is_likely_cause(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set projected_latency_ms(arg0) {
        wasm.__wbg_set_servicedegradationoutput_projected_latency_ms(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set reliability_delta(arg0) {
        wasm.__wbg_set_servicedegradationoutput_reliability_delta(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) ServiceDegradationOutput.prototype[Symbol.dispose] = ServiceDegradationOutput.prototype.free;

export class TrafficSpikeOutput {
    static __wrap(ptr) {
        const obj = Object.create(TrafficSpikeOutput.prototype);
        obj.__wbg_ptr = ptr;
        TrafficSpikeOutputFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TrafficSpikeOutputFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_trafficspikeoutput_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get dropped_request_pct() {
        const ret = wasm.__wbg_get_trafficspikeoutput_dropped_request_pct(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get peak_utilization_pct() {
        const ret = wasm.__wbg_get_trafficspikeoutput_peak_utilization_pct(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get reliability_delta() {
        const ret = wasm.__wbg_get_trafficspikeoutput_reliability_delta(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get time_to_absorb_s() {
        const ret = wasm.__wbg_get_trafficspikeoutput_time_to_absorb_s(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set dropped_request_pct(arg0) {
        wasm.__wbg_set_trafficspikeoutput_dropped_request_pct(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set peak_utilization_pct(arg0) {
        wasm.__wbg_set_trafficspikeoutput_peak_utilization_pct(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set reliability_delta(arg0) {
        wasm.__wbg_set_trafficspikeoutput_reliability_delta(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set time_to_absorb_s(arg0) {
        wasm.__wbg_set_trafficspikeoutput_time_to_absorb_s(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) TrafficSpikeOutput.prototype[Symbol.dispose] = TrafficSpikeOutput.prototype.free;

/**
 * @param {number} traffic_spike_delta
 * @param {number} deployment_failure_delta
 * @param {number} service_degradation_delta
 * @param {number} credential_compromise_delta
 * @param {number} recovery_decision_delta
 * @returns {number}
 */
export function combined_reliability_score(traffic_spike_delta, deployment_failure_delta, service_degradation_delta, credential_compromise_delta, recovery_decision_delta) {
    const ret = wasm.combined_reliability_score(traffic_spike_delta, deployment_failure_delta, service_degradation_delta, credential_compromise_delta, recovery_decision_delta);
    return ret;
}

/**
 * Real crate version, surfaced to the UI so any displayed result can be
 * attributed to a specific, verifiable build - never asserted separately
 * from what actually shipped.
 * @returns {string}
 */
export function engine_version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.engine_version(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {number} privilege_level
 * @param {boolean} rotated
 * @param {boolean} rescoped_to_least_privilege
 * @returns {CredentialCompromiseOutput}
 */
export function simulate_credential_compromise(privilege_level, rotated, rescoped_to_least_privilege) {
    const ret = wasm.simulate_credential_compromise(privilege_level, rotated, rescoped_to_least_privilege);
    return CredentialCompromiseOutput.__wrap(ret);
}

/**
 * @param {number} environment_parity_pct
 * @param {boolean} agent_isolated
 * @param {number} retry_count
 * @returns {DeploymentFailureOutput}
 */
export function simulate_deployment_failure(environment_parity_pct, agent_isolated, retry_count) {
    const ret = wasm.simulate_deployment_failure(environment_parity_pct, agent_isolated, retry_count);
    return DeploymentFailureOutput.__wrap(ret);
}

/**
 * @param {boolean} rollback_available
 * @param {number} forward_fix_confidence_pct
 * @param {number} time_pressure_level
 * @param {boolean} chose_rollback_first
 * @returns {RecoveryDecisionOutput}
 */
export function simulate_recovery_decision(rollback_available, forward_fix_confidence_pct, time_pressure_level, chose_rollback_first) {
    const ret = wasm.simulate_recovery_decision(rollback_available, forward_fix_confidence_pct, time_pressure_level, chose_rollback_first);
    return RecoveryDecisionOutput.__wrap(ret);
}

/**
 * @param {number} baseline_latency_ms
 * @param {number} connection_pool_utilization_pct
 * @param {boolean} diagnosed_before_acting
 * @returns {ServiceDegradationOutput}
 */
export function simulate_service_degradation(baseline_latency_ms, connection_pool_utilization_pct, diagnosed_before_acting) {
    const ret = wasm.simulate_service_degradation(baseline_latency_ms, connection_pool_utilization_pct, diagnosed_before_acting);
    return ServiceDegradationOutput.__wrap(ret);
}

/**
 * @param {number} baseline_rps
 * @param {number} spike_multiplier
 * @param {number} instance_capacity_rps
 * @param {boolean} autoscaling_enabled
 * @param {number} scale_out_latency_s
 * @param {number} spike_duration_s
 * @returns {TrafficSpikeOutput}
 */
export function simulate_traffic_spike(baseline_rps, spike_multiplier, instance_capacity_rps, autoscaling_enabled, scale_out_latency_s, spike_duration_s) {
    const ret = wasm.simulate_traffic_spike(baseline_rps, spike_multiplier, instance_capacity_rps, autoscaling_enabled, scale_out_latency_s, spike_duration_s);
    return TrafficSpikeOutput.__wrap(ret);
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_bb96b2010945f0bc: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
    };
    return {
        __proto__: null,
        "./mission_simulator_bg.js": import0,
    };
}

const CredentialCompromiseOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_credentialcompromiseoutput_free(ptr, 1));
const DeploymentFailureOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_deploymentfailureoutput_free(ptr, 1));
const RecoveryDecisionOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_recoverydecisionoutput_free(ptr, 1));
const ServiceDegradationOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_servicedegradationoutput_free(ptr, 1));
const TrafficSpikeOutputFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_trafficspikeoutput_free(ptr, 1));

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('mission_simulator_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
