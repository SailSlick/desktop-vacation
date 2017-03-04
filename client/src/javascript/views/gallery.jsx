import React from 'react';
import { Col, Row } from 'react-bootstrap';
import Image from './image.jsx';
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
    this.refresh(nextProps.dbId);
  }

  componentWillUnmount() {
    // Unhook all events
    document.removeEventListener('gallery_updated', this.refresh, false);
  }

  refresh(dbId) {
    dbId = (typeof dbId === 'number') ? dbId : this.props.dbId;

    Galleries.get(dbId, gallery =>
      Galleries.expand(gallery, (subgalleries, images) =>
        this.setState({
          subgalleries,
          images
        }, () => {
          console.log('Gallery refreshed');
          this.props.onRefresh();
        })
      )
    );
  }

  removeSubgallery(dbId) {
    Galleries.remove(dbId, () => true);
  }

  removeItem(id) {
    Galleries.removeItem(this.props.dbId, id, () => true);
  }

  render() {
    let items = this.state.subgalleries.map(subgallery =>
      <GalleryCard
        key={`g${subgallery.$loki}`}
        dbId={subgallery.$loki}
        name={subgallery.name}
        thumbnail={subgallery.thumbnail}
        onClick={_ => this.props.onChange(subgallery.$loki)}
        onRemove={this.removeSubgallery}
        simple={this.props.simple}
      />
    );

    if (!this.props.simple) {
      items = items.concat(this.state.images.map(image =>
        <Image
          key={image.$loki}
          dbId={image.$loki}
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
  dbId: React.PropTypes.number.isRequired,
  onChange: React.PropTypes.func.isRequired,
  onRefresh: React.PropTypes.func,
  simple: React.PropTypes.bool
};

Gallery.defaultProps = {
  simple: false,
  onRefresh: () => true
};

export default Gallery;
