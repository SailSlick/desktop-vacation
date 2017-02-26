import React from 'react';

export default (gallery, onClick) => (
  <figure className="figure img-card gallery-card rounded" onClick={onClick}>
    <img className="img-fluid" src={gallery.thumbnail} alt="Primary" />
    <h2 className="rounded">{gallery.name}</h2>
  </figure>
);
