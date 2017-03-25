import React from 'react';
import { eachOf } from 'async';
import { Col, Row, Nav, Navbar, NavItem, Glyphicon, Grid, ListGroup, ListGroupItem, Form, FormControl, Button } from 'react-bootstrap';
import Image from './image.jsx';
import GalleryCard from './gallerycard.jsx';
import Galleries from '../models/galleries';
import { success, danger } from '../helpers/notifier';

const append_gallery_event_name = 'append_gallery';

const SelectTools = ({ multiSelect, addAllToGallery, selectAll, removeAll, changeFilter }) => {
  if (!multiSelect) {
    return <br />;
  }
  return (
    <Navbar collapseOnSelect>
      <Navbar.Header>
        <Navbar.Brand>
          Tools
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar.Header>
      <Nav bsStyle="pills">
        <NavItem onClick={_ => selectAll(true)}>
          <Glyphicon glyph="plus" />
          Select All
        </NavItem>
        <NavItem onClick={_ => selectAll(false)}>
          <Glyphicon glyph="minus" />
          Deselect All
        </NavItem>
        <NavItem onClick={addAllToGallery}>
          <Glyphicon glyph="th" />
          Add To Gallery
        </NavItem>
        <NavItem onClick={removeAll}>
          <Glyphicon glyph="remove" />
          Remove
        </NavItem>
        <NavItem onClick={changeFilter}>
          <Glyphicon glyph="search" />
          Remove
        </NavItem>
      </Nav>
    </Navbar>
  );
};

SelectTools.propTypes = {
  multiSelect: React.PropTypes.bool.isRequired,
  addAllToGallery: React.PropTypes.func.isRequired,
  selectAll: React.PropTypes.func.isRequired,
  removeAll: React.PropTypes.func.isRequired,
  changeFilter: React.PropTypes.func.isRequired
};

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
    // Unhook all events
    document.removeEventListener('gallery_updated', this.refresh, false);
  }

  refresh(dbId) {
    dbId = (typeof dbId === 'number') ? dbId : this.props.dbId;

    Galleries.get(dbId, gallery =>
      Galleries.expand(gallery, this.state.filter, (subgalleries, images) =>
        this.setState({
          subgalleries,
          images,
          selection: [],
          rating: gallery.metadata.rating,
          tags: gallery.metadata.tags,
          newTag: ''
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
    if (typeof field === 'object') tags = field;
    if (typeof field === 'string') {
      if (field.length === 0) return danger('Empty tag');
      if (toRemove) tags = tags.filter(val => val !== field);
      else tags.push(field);
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

  changeFilter() {
    this.setState({ filter: {} });
  }

  render() {
    const galleryDetails = (
      <Grid>
        <Row>
          <Col xs={2} md={2}>
            <h4>Subgalleries: {this.state.subgalleries.length}</h4>
            <h4>Images: {this.state.images.length}</h4>
          </Col>
          <Col xs={5} md={5}>
            <h4>Tags:
              <ListGroup>
                {this.state.tags.map(tag => (
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  <ListGroupItem key={tag}>
                    <Row>
                      <Col xs={9} md={10}>
                        <p>{tag}</p>
                      </Col>
                      <Col xs={3} md={2}>
                        <Button bsStyle="link" onClick={_ => this.updateMetadata(tag, true)}>
                          <Glyphicon glyph={'trash'} />
                        </Button>
                      </Col>
                    </Row>
                  </ListGroupItem>
                ))
                }
                <Form
                  horizontal
                  onSubmit={e => e.preventDefault() ||
                    this.updateMetadata(this.state.newTag, false)}
                >
                  <Row>
                    <Col xs={9} md={10}>
                      <FormControl
                        name="newTag"
                        type="text"
                        placeholder="new tag"
                        value={this.state.newTag}
                        onChange={this.handleTagChange}
                      />
                    </Col>
                    <Col xs={3} md={2}>
                      <Button bsStyle="link" type="submit">
                        <Glyphicon glyph={'plus'} />
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </ListGroup>
            </h4>
          </Col>
          <Col xs={5} md={5}>
            <h4>Rating:
              {[1, 2, 3, 4, 5].map(val => (
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                <a key={val} onClick={_ => this.updateMetadata(val, false)} >
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
      ));
    }
    return (
      <Row>
        <Col xs={12}>
          <SelectTools
            multiSelect={this.props.multiSelect}
            addAllToGallery={this.addAllToGallery}
            selectAll={this.selectAll}
            removeAll={this.removeAll}
            changeFilter={this.changeFilter}
          />
        </Col>
        <Col xs={12}>
          {this.props.dbId > 1 ? galleryDetails : <br />}
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
