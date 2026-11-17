// Pure, deterministic packing. Heights come from local rendered text in CSS px.
// Columns read RTL: page 1 right/left, then page 2 right/left. A three-column
// constants band reserves the same height under both columns of page 2.
export function packFormulaGroups(measured,height,bandHeight=0){
 const columns=[[]];let used=0;
 for(const {g,h,ch,rows} of measured){let first=true;
  const total=h+rows.reduce((n,r)=>n+r.height,0);
  const capacity=height-(columns.length>=3&&columns.length<=4?bandHeight:0);
  // Keep a topic together when it fits even in a shorter page-2 column.
  if(used&&total<=height-bandHeight&&used+total>capacity){columns.push([]);used=0;}
  for(const row of rows){
   const capacity=height-(columns.length>=3&&columns.length<=4?bandHeight:0);
   if(used+row.height+(first?h:0)>capacity&&used){
    columns.push([]);used=first?h:ch;
    columns.at(-1).push({kind:'head',g,continued:!first});
   }else if(first){columns.at(-1).push({kind:'head',g});used+=h;}
   columns.at(-1).push({kind:'row',item:row.item,key:row.key});used+=row.height;first=false;
  }
 }
 return columns;
}
export function paginateFormulaGroups(measured,height,bandHeight=0){
 let columns=packFormulaGroups(measured,height,bandHeight);
 if(columns.length>4)return columns;
 let low=0,high=height;
 // Deterministic fixed iteration count, no font shrinking or row omission.
 for(let i=0;i<20;i++){
  const mid=(low+high)/2;
  if(packFormulaGroups(measured,mid,bandHeight).length<=4)high=mid;else low=mid;
 }
 return packFormulaGroups(measured,Math.min(height,high+1),bandHeight);
}
