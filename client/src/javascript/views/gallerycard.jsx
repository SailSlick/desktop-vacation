import React from 'react';
import { setSlideshow } from '../helpers/slideshow-client';

class GalleryCard extends React.Component {
  constructor(props) {
    super(props);

    // Bind onClick to this object
    this.remove = this.remove.bind(this);
    this.setSlideshow = this.setSlideshow.bind(this);
  }

  setSlideshow() {
    setSlideshow(this.props.name);
  }

  remove() {
    this.props.remove(this.props.name);
  }

  render() {
    return (
      <figure className="figure img-card gallery-card rounded" onClick={this.props.onClick}>
        <img className="img-fluid" src={this.props.thumbnail} alt="Primary" />
        <h2 className="rounded">{this.props.name}</h2>
        <figcaption className="figure-caption rounded-circle">
          ...
          <div className="dropdown-menu img-menu">
            <button
              className="dropdown-item btn-gallery-slideshow"
              onClick={this.setSlideshow}
            >Slideshow</button>
            <button
              className="dropdown-item btn-gallery-remove"
              onClick={this.remove}
            >Remove</button>
          </div>
        </figcaption>
      </figure>
    );
  }
}

GalleryCard.propTypes = {
  name: React.PropTypes.string.isRequired,
  thumbnail: React.PropTypes.string.isRequired,
  onClick: React.propTypes.func.isRequired,
  remove: React.propTypes.func.isRequired
};

export default GalleryCard;
