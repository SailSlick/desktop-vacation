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
      subgalleries: [],
      images: []
    };

    // Bind functions
    this.refresh = this.refresh.bind(this);
    this.deleteGroup = this.deleteGroup.bind(this);
  }

  componentDidMount() {
    this.refresh();
  }

  componentWillReceiveProps(nextProps) {
    this.refresh(nextProps.dbId);
  }

  refresh(dbId) {
    dbId = (typeof dbId === 'number') ? dbId : this.props.dbId;

    // Null the group ID if we're looking at the base group
    if (dbId === 1) dbId = null;

    Groups.get(dbId, (err, res, gallery) => {
      if (err) return danger(`${err}: ${res}`);
      return Groups.expand(gallery, (subgalleries, images) =>
        this.setState({
          subgalleries,
          images
        }, () => {
          console.log('Group refreshed');
        })
      );
    });
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
    const items = this.state.subgalleries.map(subgallery =>
      <GalleryCard
        group
        key={`g${subgallery._id}`}
        dbId={-1}
        mongoId={subgallery._id}
        name={subgallery.name}
        uid={subgallery.uid}
        users={subgallery.users}
        thumbnail={subgallery.thumbnail}
        onClick={_ => this.props.onChange(subgallery._id)}
        onRemove={_ => true}
      />
    ).concat(this.state.images.map(image =>
      <Image
        key={image.$loki}
        dbId={image.$loki}
        src={image.location}
        onRemove={this.removeItem}
      />
    ));

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
  dbId: React.PropTypes.number,
  onChange: React.PropTypes.func.isRequired
};

Group.defaultProps = {
  dbId: null
};

export default Group;
