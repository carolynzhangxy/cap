import {simulate} from './scene-controller.js?v=5';
self.onmessage=({data})=>{
  try {const result=simulate(data);self.postMessage(result,[result.points.buffer]);}
  catch(error){self.postMessage({error:error.message});}
};
