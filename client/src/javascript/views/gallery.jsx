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

  componentWillReceiveProps(nextProps) {
    this.refresh(nextProps.name);
  }

  componentWillUnmount() {
    // Unhook all events
    document.removeEventListener('gallery_updated', this.refresh, false);
  }

  refresh(name) {
    name = (typeof name === 'string') ? name : this.props.name;

    // Load data for all galleries
    Galleries.getSubgalleries(name, subgalleries =>
      this.setState({ subgalleries })
    );

    // Load data for all images
    Galleries.getByName(name, (gallery) => {
      async.map(
        gallery.images,
        (image_id, next) =>
          Images.get(image_id, image => next(null, image)),
        (_, images) =>
          this.setState({ images })
      );
    });
  }

  removeSubgallery(name) {
    Galleries.remove(name);
  }

  removeItem(id) {
    Galleries.removeItem(this.props.name, id);
  }

  render() {
    let items = this.state.subgalleries.map(subgallery =>
      <GalleryCard
        key={`g${subgallery.$loki}`}
        name={subgallery.name}
        thumbnail={subgallery.thumbnail}
        onClick={_ => this.props.onChange(subgallery.name)}
        remove={this.removeSubgallery}
        simple={this.props.simple}
      />
    );

    if (!this.props.simple) {
      items = items.concat(this.state.images.map(image =>
        <Image
          key={image.$loki}
          id={image.$loki}
          src={image.location}
          onRemove={this.removeItem}
        />
      ));
    }
    return (
      <Row>
        <Col xs={4}>
          {items.map((item, i) => (i % 3 === 0 && item) || null)}
        </Col>
        <Col xs={4}>
          {items.map((item, i) => ((i + 2) % 3 === 0 && item) || null)}
        </Col>
        <Col xs={4}>
          {items.map((item, i) => ((i + 1) % 3 === 0 && item) || null)}
        </Col>
      </Row>
    );
  }
}

Gallery.propTypes = {
  name: React.PropTypes.string.isRequired,
  onChange: React.PropTypes.func.isRequired,
  simple: React.PropTypes.bool
};

Gallery.defaultProps = { simple: false };

export default Gallery;
