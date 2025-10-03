import React from 'react';

export default function ChallengeInjector({ className = '' }){
  return (
    <span className={`challenge-running ${className}`} title="Challenge running — premium" style={{marginLeft:8}}>
      <span className="dot" aria-hidden="true" />
      <span style={{marginLeft:4,color:'#5c4200',fontWeight:700,fontSize:11}}>Challenge running</span>
    </span>
  );
}
