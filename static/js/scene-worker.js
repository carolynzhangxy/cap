import {simulateIllustration} from './scene-illustration.js?v=1';
self.onmessage=({data})=>{
  try {const result=simulateIllustration(data);self.postMessage(result,[result.points.buffer]);}
  catch(error){self.postMessage({error:error.message});}
};
