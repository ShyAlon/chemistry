export class ReCaptchaEnterpriseProvider{constructor(key){this.key=key}}
export function initializeAppCheck(){return {stub:true}}
export function getToken(){return Promise.resolve({token:'stub-app-check-token'})}
