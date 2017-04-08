import React from 'react';
import { eachOf } from 'async';
import mousetrap from 'mousetrap';
import Waypoint from 'react-waypoint';
import { Col, Row } from 'react-bootstrap';
import Image from './image.jsx';
import GalleryCard from './gallerycard.jsx';
import SelectTools from './selectTools.jsx';
import GalleryBar from './galleryBar.jsx';
import InfiniteScrollInfo from './infiniteScrollInfo.jsx';
import { success, danger } from '../helpers/notifier';
import Sync from '../helpers/sync';
import Galleries from '../models/galleries';
import Host from '../models/host';

const append_gallery_event_name = 'append_gallery';

class Gallery extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      subgalleries: [],
      images: [],
      selection: [],
      rating: 0,
      tags: [],
      itemsLimit: 0,
      itemsTotal: 0,
      fixSelectTools: false
    };

    // Bind functions
    this.refresh = this.refresh.bind(this);
    this.removeSubgallery = this.removeSubgallery.bind(this);
    this.addAllToGallery = this.addAllToGallery.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.uploadItem = this.uploadItem.bind(this);
    this.removeAll = this.removeAll.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.selectAll = this.selectAll.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
    this.loadMore = this.loadMore.bind(this);

    // Hook event to catch when an image is added
    document.addEventListener('gallery_updated', this.refresh, false);
    mousetrap.bind('ctrl+a', () => {
      if (this.props.multiSelect) {
        this.selectAll(true);
      }

      // Don't bubble
      return false;
    });
    mousetrap.bind('ctrl+shift+a', () => {
      if (this.props.multiSelect) {
        this.selectAll(false);
      }

      // Don't bubble
      return false;
    });
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
    // Unhook all events
    document.removeEventListener('gallery_updated', this.refresh, false);
    mousetrap.unbind('ctrl+a');
    mousetrap.unbind('ctrl+shift+a');
  }

  refresh(dbId, filter) {
    const db_update = (typeof dbId !== 'number');
    dbId = (!db_update) ? dbId : this.props.dbId;
    filter = filter || this.props.filter;

    Galleries.get(dbId, gallery =>
      Galleries.expand(gallery, filter, (subgalleries, images) =>
        this.setState({
          subgalleries,
          images,
          selection: [],
          rating: gallery.metadata.rating,
          tags: gallery.metadata.tags,
          itemsLimit: (db_update && this.state.itemsLimit >= 12) ? this.state.itemsLimit : 12,
          itemsTotal: subgalleries.length + images.length
        }, () => {
          console.log('Gallery refreshed');
          this.props.onRefresh();
        })
      )
    );
  }

  // eslint-disable-next-line class-methods-use-this
  removeSubgallery(dbId) {
    Galleries.remove(dbId, (err_msg) => {
      if (err_msg) danger(err_msg);
      else success('Gallery Removed');
    });
  }

  addAllToGallery() {
    document.dispatchEvent(new CustomEvent(
      append_gallery_event_name,
      { detail: this.state.selection }
    ));
  }

  removeItem(id, fsDelete) {
    if (fsDelete) {
      Galleries.deleteItem(id, (err_msg) => {
        if (err_msg) danger(err_msg);
        else success('Image Deleted');
      });
    } else {
      Galleries.removeItem(this.props.dbId, id, (new_gallery, err_msg) => {
        if (err_msg) danger(err_msg);
        else success('Image Removed');
      });
    }
  }

  uploadItem(id) {
    if (Host.isAuthed()) {
      Galleries.get(this.props.dbId, (gallery) => {
        if (!gallery) {
          console.error(`Couldn't find gallery: ${this.props.dbId}`);
          return;
        }
        console.log(`syncing, gallery: ${gallery.remoteId}`);
        if (gallery.remoteId) {
          Sync.uploadImages(gallery.remoteId, id, () => {});
        } else {
          danger('Can\'t sync from subgallery.');
        }
      });
    } else {
      danger('Can\'t sync, try signing in!');
    }
  }

  removeAll(cb) {
    Galleries.should_save = false;
    const num_items = this.state.selection.length;
    eachOf(this.state.selection, (id, index, next) => {
      if (index === num_items - 1) Galleries.should_save = true;
      Galleries.removeItem(this.props.dbId, id, (update, err_msg) => next(err_msg));
    },
    (err_msg) => {
      if (err_msg) danger(err_msg);
      else if (num_items === 1) success('Image removed');
      else success(`${num_items} images removed`);
      if (typeof cb === 'function') cb();
    });
  }

  selectItem(id) {
    // Avoid calling setState by making in-place changes
    const pos = this.state.selection.indexOf(id);
    if (pos === -1) {
      this.state.selection.push(id);
    } else {
      this.state.selection.splice(pos, 1);
    }
    // Dummy argument, really we just want to trigger a render
    this.setState({
      selection: this.state.selection
    });
  }

  selectAll(should_select, cb) {
    this.setState({
      selection: (should_select) ? this.state.images.map(val => val.$loki) : []
    }, cb);
  }

  updateMetadata(field, toRemove) {
    let rating = this.state.rating;
    let tags = this.state.tags;

    if (typeof field === 'number') rating = field;
    if (typeof field === 'string') {
      if (field === '') return danger('Empty tag');
      if (toRemove) tags = tags.filter(val => val !== field);
      else {
        if (tags.indexOf(field) !== -1) return danger('Tag exists');
        tags.push(field);
      }
    }

    const metadata = { rating, tags };
    return Galleries.updateMetadata(this.props.dbId, metadata, (doc) => {
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
    const galleryDetails = (
      <GalleryBar
        updateMetadata={this.updateMetadata}
        rating={this.state.rating}
        tags={this.state.tags}
        numSubgalleries={this.state.subgalleries.length}
        numImages={this.state.images.length}
        showing={this.props.infoBar}
      />
    );

    let items = this.state.subgalleries.map(subgallery =>
      <GalleryCard
        key={`g${subgallery.$loki}`}
        dbId={subgallery.$loki}
        remoteId={subgallery.remoteId}
        name={subgallery.name}
        thumbnail={subgallery.thumbnail}
        tags={subgallery.metadata.tags}
        rating={subgallery.metadata.rating}
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
          url={image.sharedUrl}
          remoteId={image.remoteId}
          onUpload={this.uploadItem}
          tags={image.metadata.tags}
          rating={image.metadata.rating}
          onRemove={this.removeItem}
          onSelect={this.selectItem}
          multiSelect={this.props.multiSelect}
          selected={this.state.selection.indexOf(image.$loki) !== -1}
        />

      // Limit number of items to show
      )).slice(0, this.state.itemsLimit);
    }

    return (
      <Row>
        <Col xs={12}>
          {this.props.dbId > 1 ? galleryDetails : ' '}
        </Col>
        <Col xs={12}>
          <SelectTools
            multiSelect={this.props.multiSelect}
            addAllToGallery={this.addAllToGallery}
            selectAll={this.selectAll}
            removeAll={this.removeAll}
          />
        </Col>
        <Col xs={4}>
          {items.map((item, i) => (i % 3 === 0 && item) || null)}
        </Col>
        <Col xs={4}>
          {items.map((item, i) => ((i + 2) % 3 === 0 && item) || null)}
        </Col>
        <Col xs={4}>
          {items.map((item, i) => ((i + 1) % 3 === 0 && item) || null)}
        </Col>
        { (this.props.simple) ? <Col /> : (
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
        )}
      </Row>
    );
  }
}

Gallery.propTypes = {
  dbId: React.PropTypes.number.isRequired,
  onChange: React.PropTypes.func.isRequired,
  simple: React.PropTypes.bool,
  multiSelect: React.PropTypes.bool,
  infoBar: React.PropTypes.bool,
  onRefresh: React.PropTypes.func,
  filter: React.PropTypes.shape({
    rating: React.PropTypes.number,
    tag: React.PropTypes.string,
    name: React.PropTypes.string
  })
};

Gallery.defaultProps = {
  filter: {
    name: '',
    rating: 0,
    tag: ''
  },
  simple: false,
  multiSelect: false,
  infoBar: false,
  onRefresh: () => true
};

export default Gallery;
