'use strict';
// Dynamic descriptions use the same local TeX renderer and fonts as the static page.
window.CAPMath=Object.freeze({
  typeset(element){
    renderMathInElement(element,{
      delimiters:[{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}],
      throwOnError:true,strict:'error',trust:false,output:'htmlAndMathml'
    });
    window.CAPMathTerms?.schedule(element);
  },
  text(element,text){
    element.textContent=text;
    this.typeset(element);
  }
});
