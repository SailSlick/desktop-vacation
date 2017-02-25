import React from 'react';
import { Row } from 'react-bootstrap';
import async from 'async';
import Image from './image';
import Images from '../models/images';
import Galleries from '../models/galleries';
import GalleryCard from './gallerycard';

class Gallery extends React.Component {
  constructor(props) {
    super(props);

    // Bind functions
    this.refresh = this.refresh.bind(this);
    this.removeSubgallery = this.removeSubgallery.bind(this);

    this.refresh();
  }

  getInitialState() {
    return {
      subgalleries: [],
      images: []
    };
  }

  refresh() {
    // Load data for all galleries
    Galleries.getSubgalleries(this.props.name, subgalleries =>
      this.setState({
        subgalleries,
        images: this.state.images
      })
    );

    // Load data for all images
    Galleries.getByName(this.props.name, (gallery) => {
      async.map(
        gallery.images,
        (image_id, next) =>
          Images.get(image_id, image => next(null, image)),
        (_, images) =>
          this.setState({
            images,
            subgalleries: this.state.subgalleries
          })
      );
    });
  }

  removeSubgallery(name) {
    Galleries.remove(name);
    this.refresh();
  }

  render() {
    return (
      <Row>
        {this.subgalleries.map(subgallery =>
          <GalleryCard
            name={subgallery.name}
            thumbnail={subgallery.thumbnail}
            onClick={_ => this.props.onChange(subgallery.name)}
            remove={this.removeSubgallery}
          />)
        }
        {this.images.map(image =>
          <Image
            id={image.$loki}
            src={image.location}
            onRemove={this.refresh}
          />)
        }
      </Row>
    );
  }
}

Gallery.propTypes = {
  name: React.PropTypes.string.isRequired,
  onChange: React.PropTypes.func.isRequired
};

export default Gallery;
