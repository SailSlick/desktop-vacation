import React from 'react';
import { Col, Row, Grid, Dropdown, Button, Glyphicon, Navbar, Nav, NavItem, FormGroup, Form, FormControl, MenuItem, InputGroup } from 'react-bootstrap';
import Image from './image.jsx';
import Groups from '../models/groups';
import Host from '../models/host';
import GalleryCard from './gallerycard.jsx';
import { success, danger } from '../helpers/notifier';

const SelectTools = ({
  multiSelect, addAllToGallery, selectAll, removeAll, changeFilter, clearFilter
}) => {
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
      <Navbar.Collapse>
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
          <NavItem onClick={clearFilter}>
            <Glyphicon glyph="remove" />
            Clear Filter
          </NavItem>
        </Nav>
        <Navbar.Form pullLeft>
          <Form onSubmit={changeFilter}>
            <FormGroup>
              <FormControl name="filterValue" type="text" placeholder="Filter gallery" />
              <FormControl name="filterKey" componentClass="select">
                <option value="name">name</option>
                <option value="tag">tag</option>
                <option value="rating">rating</option>
              </FormControl>
            </FormGroup>
            <Button type="submit">Filter</Button>
          </Form>
        </Navbar.Form>
      </Navbar.Collapse>
    </Navbar>
  );
};

SelectTools.propTypes = {
  multiSelect: React.PropTypes.bool.isRequired,
  addAllToGallery: React.PropTypes.func.isRequired,
  selectAll: React.PropTypes.func.isRequired,
  removeAll: React.PropTypes.func.isRequired,
  changeFilter: React.PropTypes.func.isRequired,
  clearFilter: React.PropTypes.func.isRequired
};

class Group extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      subgalleries: [],
      images: [],
      loggedIn: false,
      rating: 0,
      tags: [],
      newTag: '',
      filter: {
        name: '',
        tag: '',
        rating: 0
      },
      filterChanged: false
    };

    // Bind functions
    this.refresh = this.refresh.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
    this.handleTagChange = this.handleTagChange.bind(this);
    this.changeFilter = this.changeFilter.bind(this);
    this.clearFilter = this.clearFilter.bind(this);

    // Hook event to catch when a gallery is added
    document.addEventListener('gallery_updated', this.refresh, false);
  }

  componentDidMount() {
    this.refresh();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.groupId !== this.props.groupId || this.state.filterChanged) {
      this.refresh(nextProps.groupId);
    }
  }

  componentWillUnmount() {
    // Unhook all events
    document.removeEventListener('gallery_updated', this.refresh, false);
  }

  refresh(groupId) {
    groupId = (typeof groupId === 'string') ? groupId : this.props.groupId;
    // Null the group ID if we're looking at the base group
    if (groupId === '1') groupId = null;
    if (Host.isAuthed()) {
      Groups.get(groupId, (err, res, gallery) => {
        if (err) danger(`${err}: ${res}`);
        return Groups.expand(gallery, this.state.filter, (subgalleries, images) => {
          this.setState({
            subgalleries,
            images
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
      if (field.length === 0) return danger('Empty tag');
      if (toRemove) tags = tags.filter(val => val !== field);
      else tags.push(field);
    }

    const metadata = { metadata: { rating, tags } };
    return Groups.updateMetadata(this.props.groupId, this.props.dbId, metadata, (doc) => {
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

  render() {
    const groupDetails = (
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

    const items = this.state.subgalleries.map(subgallery =>
      <GalleryCard
        group
        key={`g${subgallery._id}`}
        dbId={subgallery.$loki}
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
    ));

    return (
      <Row>
        <Col xs={12}>
          {this.props.groupId > 1 ? groupDetails : ' '}
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
        <Col xs={12}>
          {this.props.groupId !== '1' ? groupDetails : <br />}
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
      </Row>
    );
  }
}

Group.propTypes = {
  groupId: React.PropTypes.string.isRequired,
  dbId: React.PropTypes.number.isRequired,
  onChange: React.PropTypes.func.isRequired,
  multiSelect: React.PropTypes.bool.isRequired
};

export default Group;
