export function getFirestore(){return {stub:true}}
export function doc(){return {stub:true}}
export function collection(){return {stub:true}}
export function serverTimestamp(){return {stub:'serverTimestamp'}}
export function getDoc(){return Promise.resolve({data:()=>({adultConfirmed:true})})}
export function setDoc(){return Promise.resolve()}
export function addDoc(){return Promise.resolve({id:'stub-miss'})}
