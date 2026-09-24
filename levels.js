(() => {
  const tiers = [
    {key:'tutorial', count:5},
    {key:'speed', count:5},
    {key:'strafe', count:5},
    {key:'precision', count:5},
    {key:'flow', count:5},
    {key:'hard', count:5}
  ];
  const levels=[];
  let id=1;
  for(const tier of tiers){
    for(let n=1;n<=tier.count;n++){
      levels.push({
        id,
        tier:tier.key,
        numberInTier:n,
        implemented:id===1,
        medal:{bronze:null,silver:null,gold:null}
      });
      id++;
    }
  }
  window.LevelCatalog={ levels, total:levels.length };
})();