import React from 'react';
import { clipboard } from 'electron';
import { Modal, MenuItem, Button, Glyphicon, Image as BsImage, Grid, Col, Row, Table, Form, FormControl, InputGroup } from 'react-bootstrap';
import { success, danger, warning } from '../helpers/notifier';
import Wallpaper from '../helpers/wallpaper-client';
import Sync from '../helpers/sync';
import Images from '../models/images';

const append_gallery_event_name = 'append_gallery';

class Image extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      deleteConfirmation: false
    };

    this.onClick = this.onClick.bind(this);
    this.setAsWallpaper = this.setAsWallpaper.bind(this);
    this.addToGallery = this.addToGallery.bind(this);
    this.expand = this.expand.bind(this);
    this.hideModals = this.hideModals.bind(this);
    this.remove = this.remove.bind(this);
    this.upload = this.upload.bind(this);
    this.deleteConfirmation = this.deleteConfirmation.bind(this);
    this.confirmDelete = this.confirmDelete.bind(this);
    this.share = this.share.bind(this);
    this.unshare = this.unshare.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
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

  upload() {
    Sync.uploadImages([this.props.dbId], () => {});
  }

  unshare() {
    return Sync.unshareImage(this.props.remoteId, (err) => {
      if (err) return danger(err);
      return Images.update(
        this.props.dbId,
        { sharedUrl: null },
        () => success('Image no longer available')
      );
    });
  }

  share() {
    if (!this.props.remoteId) {
      return warning('You need to sync an image to share it!');
    } else if (this.props.url) {
      success('Image link copied to clipboard!');
      return clipboard.writeText(this.props.url);
    }
    return Sync.shareImage(this.props.remoteId, (err, url) => {
      if (err) return danger(err);
      return Images.update(
        this.props.dbId,
        { sharedUrl: url },
        () => {
          success('Image link copied to clipboard!');
          clipboard.writeText(url);
        }
      );
    });
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
      field = field.trim();
      if (field === '') return danger('Empty tag');
      if (field.indexOf(',') !== -1) return danger('Tags can\'t have commas');
      if (toRemove) tags = tags.filter(val => val !== field);
      else {
        if (tags.indexOf(field) !== -1) return danger('Tag exists');
        tags.push(field);
      }
    }

    const metadata = { metadata: { rating, tags } };
    return Images.update(this.props.dbId, metadata, (doc) => {
      if (!doc) return danger('Updating metadata failed');
      return success('Metadata updated');
    });
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
              <td>
                <h4>Tags:</h4>
              </td>
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
          onSubmit={e => e.preventDefault() ||
            this.updateMetadata(e.target.newTag.value, false)}
        >
          <InputGroup>
            <FormControl
              name="newTag"
              type="text"
              placeholder="new tag"
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
        <Col><h2>Metadata</h2></Col>
        {starRating}
        {tags}
      </row>
    );

    let shareButtons = (
      <MenuItem onClick={this.share}>
        <Glyphicon glyph="share" />
        Share
      </MenuItem>
    );
    if (this.props.url) {
      shareButtons = ([
        <MenuItem key="copyurlButton" onClick={this.share}>
          <Glyphicon glyph="copy" />
          Copy URL
        </MenuItem>,
        <MenuItem key="unshareButton" onClick={this.unshare}>
          <Glyphicon glyph="lock" />
          Unshare
        </MenuItem>
      ]);
    }
    let galleryImage;
    let removeDelete;
    let groupImage;
    if (!this.props.group) {
      galleryImage = ([
        <MenuItem onClick={this.addToGallery} key="add">
          <Glyphicon glyph="th" />
          Add to ...
        </MenuItem>,
        <MenuItem onClick={this.upload} key="upload">
          <Glyphicon glyph="upload" />
          Sync
        </MenuItem>
      ]);
      removeDelete = (
        <MenuItem onClick={this.deleteConfirmation}>
          <Glyphicon glyph="trash" />
          Remove &amp; Delete
        </MenuItem>
      );
    } else {
      groupImage = (
        <MenuItem onClick={this.props.save}>
          <Glyphicon glyph="download" />
          Save
        </MenuItem>
      );
    }

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
            {galleryImage}
            {groupImage}
            <MenuItem onClick={this.remove}>
              <Glyphicon glyph="remove" />
              Remove
            </MenuItem>
            {removeDelete}
            <MenuItem divider />
            {shareButtons}
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
  save: React.PropTypes.func,
  url: React.PropTypes.string,
  remoteId: React.PropTypes.string,
  multiSelect: React.PropTypes.bool,
  selected: React.PropTypes.bool,
  group: React.PropTypes.bool
};

Image.defaultProps = {
  onSelect: _ => true,
  save: _ => true,
  multiSelect: false,
  selected: false,
  group: false,
  url: null,
  remoteId: null
};

export default Image;
