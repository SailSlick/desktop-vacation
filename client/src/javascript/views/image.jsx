import React from 'react';
import { Modal, MenuItem, Button, Glyphicon, Image as BsImage, Grid, Col, Row, Table, Form, FormControl, InputGroup } from 'react-bootstrap';
import Wallpaper from '../helpers/wallpaper-client';
import Images from '../models/images';
import { success, danger } from '../helpers/notifier';

const append_gallery_event_name = 'append_gallery';

class Image extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      deleteConfirmation: false,
      newTag: ''
    };

    this.onClick = this.onClick.bind(this);
    this.setAsWallpaper = this.setAsWallpaper.bind(this);
    this.addToGallery = this.addToGallery.bind(this);
    this.expand = this.expand.bind(this);
    this.hideModals = this.hideModals.bind(this);
    this.remove = this.remove.bind(this);
    this.deleteConfirmation = this.deleteConfirmation.bind(this);
    this.confirmDelete = this.confirmDelete.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
    this.handleTagChange = this.handleTagChange.bind(this);
  }

  onClick() {
    if (this.props.multiSelect) {
      this.props.onSelect(this.props.dbId);
    } else {
      this.expand();
    }
  }

  setAsWallpaper() {
    Wallpaper.set(this.props.src);
  }

  addToGallery() {
    document.dispatchEvent(new CustomEvent(
      append_gallery_event_name,
      { detail: [this.props.dbId] }
    ));
  }

  expand() {
    this.setState({ expanded: true });
  }

  hideModals() {
    this.setState({
      expanded: false,
      deleteConfirmation: false
    });
  }

  remove() {
    this.props.onRemove(this.props.dbId, false);
  }

  deleteConfirmation() {
    this.setState({ deleteConfirmation: true });
  }

  confirmDelete() {
    this.props.onRemove(this.props.dbId, true);
    this.setState({ deleteConfirmation: false });
  }

  updateMetadata(field, toRemove) {
    let rating = this.props.rating;
    let tags = this.props.tags;

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
    return Images.updateMetadata(this.props.dbId, metadata, (doc) => {
      if (!doc) return danger('Updating metadata failed');
      if (typeof field === 'string') this.setState({ newTag: '' });
      return success('Metadata updated');
    });
  }

  handleTagChange(event) {
    this.setState({ newTag: event.target.value });
  }

  render() {
    let classes = 'figure img-card rounded';
    if (this.props.selected) classes += ' selected';
    const starRating = (
      <Col>
        <h4>Rating:</h4>
        {[1, 2, 3, 4, 5].map(val => (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions
          <a key={val} onClick={_ => this.updateMetadata(val, false)} >
            <Glyphicon glyph={this.props.rating >= val ? 'star' : 'star-empty'} />
          </a>
        ))
        }
      </Col>
    );
    const tags = (
      <Col>
        <Table>
          <thead>
            <tr>
              <th>
                <h4>Tags:</h4>
              </th>
            </tr>
          </thead>
          <tbody>
            {this.props.tags.map(tag => (
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions
              <tr key={tag} >
                <td colSpan="2">{tag}</td>
                <td>
                  <Button
                    bsStyle="link"
                    onClick={e => e.preventDefault() || this.updateMetadata(tag, true)}
                  >
                    <Glyphicon glyph={'trash'} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
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
    );

    const metadataRow = (
      <row>
        <Col><h2>Metdata</h2></Col>
        {starRating}
        {tags}
      </row>
    );

    return (
      <figure className={classes}>
        <BsImage responsive src={this.props.src} alt="MISSING" onClick={this.onClick} />
        <figcaption className="figure-caption rounded-circle">
          ...
          <div className="dropdown-menu img-menu">
            <MenuItem onClick={this.setAsWallpaper}>
              <Glyphicon glyph="picture" />
              Set as Wallpaper
            </MenuItem>
            <MenuItem onClick={this.addToGallery}>
              <Glyphicon glyph="th" />
              Add to gallery
            </MenuItem>
            <MenuItem divider />
            <MenuItem onClick={this.remove}>
              <Glyphicon glyph="remove" />
              Remove
            </MenuItem>
            <MenuItem onClick={this.deleteConfirmation}>
              <Glyphicon glyph="trash" />
              Remove &amp; Delete
            </MenuItem>
          </div>
        </figcaption>

        <Modal className="big-modal" show={this.state.expanded} onHide={this.hideModals}>
          <Modal.Header closeButton>
            <Modal.Title>{this.props.src}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Grid fluid>
              <Row>
                <Col xs={9} md={10}>
                  <BsImage responsive src={this.props.src} alt="MISSING" />
                </Col>
                <Col xs={3} md={2}>
                  {metadataRow}
                </Col>
              </Row>
            </Grid>
          </Modal.Body>
        </Modal>

        <Modal show={this.state.deleteConfirmation} onHide={this.hideModals}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete <code>{this.props.src}</code>?</p>
            <BsImage className="small-preview" src={this.props.src} alt="MISSING" />
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.hideModals}>Cancel</Button>
            <Button onClick={this.confirmDelete} bsStyle="primary">Yes, I&#39;m sure</Button>
          </Modal.Footer>
        </Modal>

      </figure>
    );
  }
}

Image.propTypes = {
  dbId: React.PropTypes.number.isRequired,
  src: React.PropTypes.string.isRequired,
  rating: React.PropTypes.number.isRequired,
  tags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  onRemove: React.PropTypes.func.isRequired,
  onSelect: React.PropTypes.func,
  multiSelect: React.PropTypes.bool,
  selected: React.PropTypes.bool
};

Image.defaultProps = {
  onSelect: _ => true,
  multiSelect: false,
  selected: false
};

export default Image;
