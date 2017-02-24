import React from 'react';

export default gallery => (
  <figure className="figure img-card gallery-card rounded" onClick={this.props.onClick}>
    <img className="img-fluid" src={gallery.thumbnail} alt="Primary" />
    <h2 className="rounded">{gallery.name}</h2>
  </figure>
);
