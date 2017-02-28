import React from 'react';
import { MenuItem, Image as BsImage } from 'react-bootstrap';
import Slideshow from '../helpers/slideshow-client';

class GalleryCard extends React.Component {
  constructor(props) {
    super(props);

    // Bind onClick to this object
    this.remove = this.remove.bind(this);
    this.setSlideshow = this.setSlideshow.bind(this);
  }

  setSlideshow() {
    Slideshow.setSlideshow(this.props.name);
  }

  remove() {
    this.props.remove(this.props.name);
  }

  render() {
    return (
      <figure className="figure img-card gallery-card rounded" onClick={this.props.onClick}>
        <BsImage responsive src={this.props.thumbnail} alt="" />
        <h2 className="rounded">{this.props.name}</h2>
        <figcaption className="figure-caption rounded-circle">
          ...
          <div className="dropdown-menu img-menu">
            <MenuItem onClick={this.setSlideshow}>
              Slideshow
            </MenuItem>
            <MenuItem divider />
            <MenuItem onClick={this.remove}>
              Remove
            </MenuItem>
          </div>
        </figcaption>
      </figure>
    );
  }
}

GalleryCard.propTypes = {
  name: React.PropTypes.string.isRequired,
  thumbnail: React.PropTypes.string,
  onClick: React.PropTypes.func.isRequired,
  remove: React.PropTypes.func.isRequired
};

GalleryCard.defaultProps = {
  thumbnail: ''
};

export default GalleryCard;
