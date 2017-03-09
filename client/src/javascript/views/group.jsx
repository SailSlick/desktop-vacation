import React from 'react';
import { Col, Row } from 'react-bootstrap';
import Image from './image.jsx';
import Groups from '../models/groups';
import GalleryCard from './gallerycard.jsx';
import { success, danger } from '../helpers/notifier';

class Group extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      subgroups: [],
      images: []
    };

    // Bind functions
    this.refresh = this.refresh.bind(this);
    this.deleteGroup = this.deleteGroup.bind(this);

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
    if (dbId === 1) {
      Groups.getAll((err, msg, data) => {
        if (err) return danger(msg);
        data.forEach()
        return success(msg);
      });
    }
    Groups.get(dbId, gallery =>
      Groups.expand(gallery, (subgroups, images) =>
        this.setState({
          subgroups,
          images
        }, () => {
          console.log('Gallery refreshed');
        })
      )
    );
  }

  // eslint-disable-next-line class-methods-use-this
  deleteGroup(mongoId, id) {
    Groups.delete(mongoId, id, (err, msg) => {
      if (err) danger(msg);
      else {
        success(msg);
      }
    });
  }

  removeItem(id, fsDelete) {
    if (fsDelete) {
      Groups.deleteItem(id, () => true);
    } else {
      Groups.removeItem(this.props.dbId, id, () => true);
    }
  }

  render() {
    let items = this.state.subgroups.map(subgallery =>
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

Group.propTypes = {
  dbId: React.PropTypes.number.isRequired,
  onChange: React.PropTypes.func.isRequired,
  simple: React.PropTypes.bool
};

Group.defaultProps = {
  simple: false,
};

export default Group;
