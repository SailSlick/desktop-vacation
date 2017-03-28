import React from 'react';
import { eachOf } from 'async';
import mousetrap from 'mousetrap';
import Waypoint from 'react-waypoint';
import { Col, Row, Glyphicon, Grid, Dropdown, Form, FormControl, Button, InputGroup, MenuItem } from 'react-bootstrap';
import Image from './image.jsx';
import GalleryCard from './gallerycard.jsx';
import SelectTools from './selectTools.jsx';
import InfiniteScrollInfo from './infiniteScrollInfo.jsx';
import { success, danger } from '../helpers/notifier';
import Galleries from '../models/galleries';

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
      newTag: '',
      filter: {
        name: '',
        tag: '',
        rating: 0
      },
      filterChanged: false,
      itemsLimit: 0,
      itemsTotal: 0,
      fixSelectTools: false
    };

    // Bind functions
    this.refresh = this.refresh.bind(this);
    this.removeSubgallery = this.removeSubgallery.bind(this);
    this.addAllToGallery = this.addAllToGallery.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.removeAll = this.removeAll.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.selectAll = this.selectAll.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
    this.handleTagChange = this.handleTagChange.bind(this);
    this.changeFilter = this.changeFilter.bind(this);
    this.clearFilter = this.clearFilter.bind(this);
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
    if (nextProps.dbId !== this.props.dbId || this.state.filterChanged) {
      this.refresh(nextProps.dbId);
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

  refresh(dbId) {
    const db_update = (typeof dbId !== 'number');
    dbId = (!db_update) ? dbId : this.props.dbId;

    Galleries.get(dbId, gallery =>
      Galleries.expand(gallery, this.state.filter, (subgalleries, images) =>
        this.setState({
          subgalleries,
          images,
          selection: [],
          rating: gallery.metadata.rating,
          tags: gallery.metadata.tags,
          newTag: '',
          filterChanged: false,
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

    const metadata = { metadata: { rating, tags } };
    return Galleries.updateMetadata(this.props.dbId, metadata, (doc) => {
      if (!doc) return danger('Updating metadata failed');
      if (typeof field === 'string') this.setState({ newTag: '' });
      return success('Metadata updated');
    });
  }

  handleTagChange(event) {
    this.setState({ newTag: event.target.value });
  }

  changeFilter(event) {
    event.preventDefault();
    const filter = {};
    const key = event.target.filterKey.value;
    let value = event.target.filterValue.value;
    if (key === 'rating') {
      value = Number(value);
      if (isNaN(value) || value > 5 || value < 0) return danger('Rating must be a number between 0 & 5');
    }
    filter[key] = value;
    success('Filtering');
    return this.setState({ filter, filterChanged: true });
  }

  clearFilter() {
    success('Filter cleared');
    return this.setState({ filter: {}, filterChanged: true });
  }

  loadMore() {
    // Don't do anything if we're at the end
    if (this.state.itemsLimit === this.state.itemsTotal) return;

    const itemsLimit = Math.min(this.state.itemsLimit + 12, this.state.itemsTotal);
    this.setState({ itemsLimit });
  }

  render() {
    const galleryDetails = (
      <Grid>
        <Row>
          <Col xs={2} md={2}>
            <h4>Subgalleries: {this.state.subgalleries.length}</h4>
            <h4>Images: {this.state.images.length}</h4>
          </Col>
          <Col xs={2} md={2}>
            <Dropdown pullRight id="tags-dropdown">
              <Dropdown.Toggle>
                Tags
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {this.state.tags.map(tag => (
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  <MenuItem key={tag} >
                    <InputGroup>
                      <p colSpan="2">{tag}</p>
                      <InputGroup.Button>
                        <Button
                          bsStyle="link"
                          onClick={e => e.preventDefault() || this.updateMetadata(tag, true)}
                        >
                          <Glyphicon glyph={'trash'} />
                        </Button>
                      </InputGroup.Button>
                    </InputGroup>
                  </MenuItem>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col xs={4} md={4}>
            <Form
              horizontal
              onSubmit={e => e.preventDefault() || this.updateMetadata(this.state.newTag, false)}
            >
              <InputGroup>
                <FormControl
                  name="newTag"
                  type="text"
                  placeholder="new tag"
                  value={this.state.newTag}
                  onChange={this.handleTagChange}
                />
                <InputGroup.Button>
                  <Button type="submit">
                    <Glyphicon glyph={'plus'} />
                  </Button>
                </InputGroup.Button>
              </InputGroup>
            </Form>
          </Col>
          <Col xs={4} md={4}>
            <h4>Rating:
              {[1, 2, 3, 4, 5].map(val => (
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                <a key={val} onClick={e => e.preventDefault() || this.updateMetadata(val, false)} >
                  <Glyphicon glyph={this.state.rating >= val ? 'star' : 'star-empty'} />
                </a>
              ))
              }
            </h4>
          </Col>
        </Row>
      </Grid>
    );

    let items = this.state.subgalleries.map(subgallery =>
      <GalleryCard
        key={`g${subgallery.$loki}`}
        dbId={subgallery.$loki}
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
            changeFilter={this.changeFilter}
            clearFilter={this.clearFilter}
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
  onRefresh: React.PropTypes.func
};

Gallery.defaultProps = {
  simple: false,
  multiSelect: false,
  onRefresh: () => true
};

export default Gallery;
