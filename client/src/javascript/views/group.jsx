import React from 'react';
import Waypoint from 'react-waypoint';
import { Col, Row } from 'react-bootstrap';
import Image from './image.jsx';
import GalleryCard from './gallerycard.jsx';
import InfiniteScrollInfo from './infiniteScrollInfo.jsx';
import { success, danger } from '../helpers/notifier';
import Groups from '../models/groups';
import Host from '../models/host';

class Group extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      subgalleries: [],
      images: [],
      loggedIn: false,
      itemsLimit: 0,
      itemsTotal: 0
    };

    // Bind functions
    this.refresh = this.refresh.bind(this);
    this.deleteGroup = this.deleteGroup.bind(this);
    this.loadMore = this.loadMore.bind(this);

    // Hook event to catch when an image is added
    document.addEventListener('gallery_updated', this.refresh, false);
  }

  componentDidMount() {
    this.refresh();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.dbId !== this.props.dbId) this.refresh(nextProps.dbId);
  }

  componentWillUnmount() {
    document.removeEventListener('gallery_updated', this.refresh, false);
  }

  refresh(dbId) {
    const db_update = (typeof dbId !== 'number');
    dbId = (!db_update) ? dbId : this.props.dbId;

    // Null the group ID if we're looking at the base group
    if (dbId === '1') dbId = null;
    if (Host.isAuthed()) {
      Groups.get(dbId, (err, res, gallery) => {
        if (err) danger(`${err}: ${res}`);
        return Groups.expand(gallery, (subgalleries, images) =>
          this.setState({
            subgalleries,
            images,
            itemsLimit: (db_update && this.state.itemsLimit >= 12) ? this.state.itemsLimit : 12,
            itemsTotal: subgalleries.length + images.length
          }, () => {
            console.log('Group refreshed', dbId);
          })
        );
      });
    }
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

  loadMore() {
    // Don't do anything if we're at the end
    if (this.state.itemsLimit === this.state.itemsTotal) return;

    const itemsLimit = Math.min(this.state.itemsLimit + 12, this.state.itemsTotal);
    this.setState({ itemsLimit });
  }

  render() {
    const items = this.state.subgalleries.map(subgallery =>
      <GalleryCard
        group
        key={`g${subgallery._id}`}
        dbId={subgallery.$loki || 0}
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

    // Limit number of items to show
    )).slice(0, this.state.itemsLimit);

    return (
      <Row>
        <br />
        <Col xs={4}>
          {items.map((item, i) => (i % 3 === 0 && item) || null)}
        </Col>
        <Col xs={4}>
          {items.map((item, i) => ((i + 2) % 3 === 0 && item) || null)}
        </Col>
        <Col xs={4}>
          {items.map((item, i) => ((i + 1) % 3 === 0 && item) || null)}
        </Col>
        <Col xs={12}>
          <InfiniteScrollInfo
            itemsLimit={this.state.itemsLimit}
            itemsTotal={this.state.itemsTotal}
          />
          <Waypoint onEnter={this.loadMore} />
        </Col>
      </Row>
    );
  }
}

Group.propTypes = {
  dbId: React.PropTypes.string.isRequired,
  onChange: React.PropTypes.func.isRequired
};

export default Group;
