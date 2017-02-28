import React from 'react';
import { Image as BsImage } from 'react-bootstrap';

const SimpleGalleryCard = props => (
  <figure className="figure img-card gallery-card rounded" onClick={props.onClick}>
    <BsImage responsive src={props.thumbnail} alt="" />
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
