export function orbitalFor(topic){const orbital=topic.orbital;return orbital?{...orbital,src:import.meta.env.BASE_URL+'orbitals/'+orbital.file}:null}
