import React from 'react';

const SimpleGalleryCard = props => (
  <figure className="figure img-card gallery-card rounded" onClick={props.onClick}>
    <img className="img-fluid" src={props.thumbnail} alt="" />
    <h2 className="rounded">{props.name}</h2>
  </figure>
);

SimpleGalleryCard.propTypes = {
  onClick: React.PropTypes.func.isRequired,
  thumbnail: React.PropTypes.string,
  name: React.PropTypes.string.isRequired
};

SimpleGalleryCard.defaultProps = {
  thumbnail: ''
};

export default SimpleGalleryCard;
