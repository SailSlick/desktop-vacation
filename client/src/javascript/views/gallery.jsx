import React from 'react';
import { each } from 'async';
import { Col, Row, Nav, Navbar, NavItem, Glyphicon } from 'react-bootstrap';
import Image from './image.jsx';
import Galleries from '../models/galleries';
import GalleryCard from './gallerycard.jsx';

const append_gallery_event_name = 'append_gallery';

const SelectTools = ({ multiSelect, addAllToGallery, selectAll, removeAll }) => {
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
          <Glyphicon glyph="plus" />Select All
        </NavItem>
        <NavItem onClick={_ => selectAll(false)}>
          <Glyphicon glyph="minus" />Deselect All
        </NavItem>
        <NavItem onClick={addAllToGallery}>
          <Glyphicon glyph="th" />Add To Gallery
        </NavItem>
        <NavItem onClick={removeAll}>
          <Glyphicon glyph="remove" />Remove
        </NavItem>
      </Nav>
    </Navbar>
  );
};

SelectTools.propTypes = {
  multiSelect: React.PropTypes.bool.isRequired,
  addAllToGallery: React.PropTypes.func.isRequired,
  selectAll: React.PropTypes.func.isRequired,
  removeAll: React.PropTypes.func.isRequired
};

class Gallery extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      subgalleries: [],
      images: [],
      selection: []
    };

    // Bind functions
    this.refresh = this.refresh.bind(this);
    this.removeSubgallery = this.removeSubgallery.bind(this);
    this.addAllToGallery = this.addAllToGallery.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.removeAll = this.removeAll.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.selectAll = this.selectAll.bind(this);

    // Hook event to catch when an image is added
    document.addEventListener('gallery_updated', this.refresh, false);
  }

  componentDidMount() {
    this.refresh();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.dbId !== this.props.dbId) {
      this.refresh(nextProps.dbId);
    }
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
          images,
          selection: []
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

  addAllToGallery() {
    document.dispatchEvent(new CustomEvent(
      append_gallery_event_name,
      { detail: this.state.selection }
    ));
  }

  removeItem(id) {
    Galleries.removeItem(this.props.dbId, id, () => true);
  }

  removeAll() {
    Galleries.disableSaving();
    each(this.state.selection, (id, next) =>
      Galleries.removeItem(this.props.dbId, id, next),
    () =>
      Galleries.enableSaving()
    );
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

  selectAll(should_select) {
    this.setState({
      selection: (should_select) ? this.state.images.map(val => val.$loki) : []
    });
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
      </Row>
    );
  }
}

Gallery.propTypes = {
  dbId: React.PropTypes.number.isRequired,
  onChange: React.PropTypes.func.isRequired,
  onRefresh: React.PropTypes.func,
  simple: React.PropTypes.bool,
  multiSelect: React.PropTypes.bool
};

Gallery.defaultProps = {
  simple: false,
  multiSelect: false,
  onRefresh: () => true
};

export default Gallery;
