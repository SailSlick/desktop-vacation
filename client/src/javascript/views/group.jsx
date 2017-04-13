import React from 'react';
import Waypoint from 'react-waypoint';
import { Col, Row } from 'react-bootstrap';
import Image from './image.jsx';
import GalleryCard from './gallerycard.jsx';
import SelectTools from './selectTools.jsx';
import FilterTools from './filterTools.jsx';
import GalleryBar from './galleryBar.jsx';
import InfiniteScrollInfo from './infiniteScrollInfo.jsx';
import { danger, success } from '../helpers/notifier';
import Groups from '../models/groups';
import Host from '../models/host';

class Group extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      subgalleries: [],
      images: [],
      loggedIn: false,
      rating: 0,
      tags: [],
      itemsLimit: 0,
      itemsTotal: 0
    };

    // Bind functions
    this.refresh = this.refresh.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
    this.loadMore = this.loadMore.bind(this);

    document.addEventListener('gallery_updated', this.refresh, false);
  }

  componentDidMount() {
    this.refresh();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.dbId !== this.props.dbId ||
    this.props.filter.rating !== nextProps.filter.rating ||
    this.props.filter.name !== nextProps.filter.name ||
    this.props.filter.tag !== nextProps.filter.tag) {
      this.refresh(nextProps.dbId, nextProps.filter);
    }
    if (!nextProps.multiSelect) {
      this.setState({ selection: [] });
    }
  }

  componentWillUnmount() {
    document.removeEventListener('gallery_updated', this.refresh, false);
  }

  refresh(groupId, filter) {
    const db_update = (typeof groupId !== 'number');
    groupId = (typeof groupId === 'string') ? groupId : this.props.groupId;
    filter = filter || this.props.filter;

    // Null the group ID if we're looking at the base group
    if (groupId === '1') groupId = null;
    if (Host.isAuthed()) {
      Groups.get(groupId, (err, res, gallery) => {
        if (err) danger(`${err}: ${res}`);
        return Groups.expand(gallery, filter, (subgalleries, images) => {
          this.setState({
            subgalleries,
            images,
            itemsLimit: (db_update && this.state.itemsLimit >= 12) ? this.state.itemsLimit : 12,
            itemsTotal: subgalleries.length + images.length
          }, () => {
            console.log('Group refreshed', groupId);
          });
        });
      });
    }
  }

  removeItem(id, fsDelete) {
    if (fsDelete) {
      Groups.deleteItem(id, () => true);
    } else {
      Groups.removeItem(this.props.groupId, id, () => true);
    }
  }

  updateMetadata(field, toRemove) {
    let rating = this.state.rating;
    let tags = this.state.tags;

    if (typeof field === 'number') rating = field;
    if (typeof field === 'object') tags = field;
    if (typeof field === 'string') {
      field = field.trim();
      if (field.length === 0) return danger('Empty tag');
      if (field.indexOf(',') !== -1) return danger('Tags can\'t have commas');
      if (toRemove) tags = tags.filter(val => val !== field);
      else tags.push(field);
    }

    const metadata = { rating, tags };
    return Groups.updateMetadata(this.props.groupId, this.props.dbId, metadata, (doc) => {
      if (!doc) return danger('Updating metadata failed');
      return success('Metadata updated');
    });
  }

  loadMore() {
    // Don't do anything if we're at the end
    if (this.state.itemsLimit === this.state.itemsTotal) return;

    const itemsLimit = Math.min(this.state.itemsLimit + 12, this.state.itemsTotal);
    this.setState({ itemsLimit });
  }

  render() {
    const groupDetails = (
      <GalleryBar
        updateMetadata={this.updateMetadata}
        rating={this.state.rating}
        tags={this.state.tags}
        numSubgalleries={this.state.subgalleries.length}
        numImages={this.state.images.length}
        showing={this.props.infoBar}
      />
    );

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
        onClick={_ => this.props.onChange(subgallery._id, subgallery.$loki)}
        onRemove={_ => true}
        tags={subgallery.metadata.tags}
        rating={subgallery.metadata.rating}
      />
    ).concat(this.state.images.map(image =>
      <Image
        key={image.$loki}
        dbId={image.$loki}
        src={image.location}
        onRemove={this.removeItem}
        tags={image.metadata.tags}
        rating={image.metadata.rating}
      />

    // Limit number of items to show
    )).slice(0, this.state.itemsLimit);

    return (
      <Row>
        <Col xs={12}>
          {this.props.groupId !== '1' ? groupDetails : ' '}
        </Col>
        <Col xs={12}>
          <SelectTools
            multiSelect={this.props.multiSelect}
            addAllToGallery={() => {}}
            selectAll={() => {}}
            removeAll={() => {}}
            tagAll={() => {}}
            rateAll={() => {}}
          />
          <FilterTools
            filterToggle={this.props.filterToggle}
            changeFilter={this.props.changeFilter}
          />
        </Col>
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
          <Waypoint onEnter={this.loadMore}>
            <div>
              <InfiniteScrollInfo
                itemsLimit={this.state.itemsLimit}
                itemsTotal={this.state.itemsTotal}
              />
            </div>
          </Waypoint>
        </Col>
      </Row>
    );
  }
}

Group.propTypes = {
  groupId: React.PropTypes.string.isRequired,
  dbId: React.PropTypes.number.isRequired,
  onChange: React.PropTypes.func.isRequired,
  changeFilter: React.PropTypes.func,
  filterToggle: React.PropTypes.bool,
  infoBar: React.PropTypes.bool,
  multiSelect: React.PropTypes.bool,
  filter: React.PropTypes.shape({
    rating: React.PropTypes.number,
    tag: React.PropTypes.string,
    name: React.PropTypes.string
  })
};

Group.defaultProps = {
  filter: {
    name: '',
    rating: 0,
    tag: ''
  },
  multiSelect: false,
  filterToggle: false,
  changeFilter: () => true,
  infoBar: false,
};

export default Group;
