import React from 'react';
import { Col, Row } from 'react-bootstrap';
import async from 'async';
import Image from './image.jsx';
import Images from '../models/images';
import Galleries from '../models/galleries';
import GalleryCard from './gallerycard.jsx';

class Gallery extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      subgalleries: [],
      images: []
    };

    // Bind functions
    this.refresh = this.refresh.bind(this);
    this.removeSubgallery = this.removeSubgallery.bind(this);
    this.removeItem = this.removeItem.bind(this);

    // Hook event to catch when an image is added
    document.addEventListener('gallery_updated', this.refresh, false);
  }

  componentDidMount() {
    this.refresh();
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

  removeItem(id) {
    Galleries.removeItem(this.props.name, id);
    this.refresh();
  }

  render() {
    return (
      <Row>
        {this.state.subgalleries.map(subgallery =>
          <Col xs={4}>
            <GalleryCard
              name={subgallery.name}
              thumbnail={subgallery.thumbnail}
              onClick={_ => this.props.onChange(subgallery.name)}
              remove={this.removeSubgallery}
            />
          </Col>
        )}
        <Row>
          <Col xs={4}>
            {this.state.images.map((image, i) => {
              if (i % 3 !== 0) return null;
              return (
                <Image
                  id={image.$loki}
                  src={image.location}
                  onRemove={this.removeItem}
                />
              );
            })}
          </Col>
          <Col xs={4}>
            {this.state.images.map((image, i) => {
              if ((i + 1) % 3 !== 0) return null;
              return (
                <Image
                  id={image.$loki}
                  src={image.location}
                  onRemove={this.removeItem}
                />
              );
            })}
          </Col>
          <Col xs={4}>
            {this.state.images.map((image, i) => {
              if ((i + 2) % 3 !== 0) return null;
              return (
                <Image
                  id={image.$loki}
                  src={image.location}
                  onRemove={this.removeItem}
                />
              );
            })}
          </Col>
        </Row>
      </Row>
    );
  }
}

Gallery.propTypes = {
  name: React.PropTypes.string.isRequired,
  onChange: React.PropTypes.func.isRequired
};

export default Gallery;
