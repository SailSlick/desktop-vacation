import React from 'react';
import { MenuItem, Glyphicon, Image as BsImage, Modal } from 'react-bootstrap';
import Slideshow from '../helpers/slideshow-client';
import GroupManager from './groupManager.jsx';
import { success, danger } from '../helpers/notifier';
import Groups from '../models/groups';

const ActionMenu = ({ simple, group, setSlideshow, onRemove, groupConvert, groupMenu }) => {
  if (simple) {
    return <figcaption style={{ display: 'none' }} />;
  }
  let index = 0;
  if (group) index = 1;

  return [(
    <figcaption className="figure-caption rounded-circle">
      ...
      <div className="dropdown-menu img-menu">
        <MenuItem onClick={setSlideshow}>
          <Glyphicon glyph="film" />Slideshow
        </MenuItem>
        <MenuItem divider />
        <MenuItem onClick={onRemove}>
          <Glyphicon glyph="remove" />Remove
        </MenuItem>
        <MenuItem onClick={groupConvert}>
          <Glyphicon glyph="transfer" />Switch to Group
        </MenuItem>
      </div>
    </figcaption>
  ), (
    <figcaption className="figure-caption rounded-circle">
      ...
      <div className="dropdown-menu img-menu">
        <MenuItem onClick={setSlideshow}>
          <Glyphicon glyph="film" />Slideshow
        </MenuItem>
        <MenuItem divider />
        <MenuItem onClick={groupMenu}>
          <Glyphicon glyph="list" />Group Manager
        </MenuItem>
      </div>
    </figcaption>
  )][index];
};

ActionMenu.propTypes = {
  simple: React.PropTypes.bool.isRequired,
  group: React.PropTypes.bool.isRequired,
  setSlideshow: React.PropTypes.func.isRequired,
  onRemove: React.PropTypes.func.isRequired,
  groupConvert: React.PropTypes.func.isRequired,
  groupMenu: React.PropTypes.func.isRequired
};

class GalleryCard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      groupManagerModal: false
    };

    // Bind onClick to this object
    this.remove = this.remove.bind(this);
    this.setSlideshow = this.setSlideshow.bind(this);
    this.groupConvert = this.groupConvert.bind(this);
    this.groupMenu = this.groupMenu.bind(this);
    this.hideModals = this.hideModals.bind(this);
  }

  setSlideshow() {
    Slideshow.set(this.props.dbId);
  }

  // eslint-disable-next-line class-methods-use-this
  groupConvert() {
    Groups.convert(this.props.name, this.props.dbId, (err, msg) => {
      if (err) return danger(msg);
      return success(msg);
    });
  }

  remove() {
    this.props.onRemove(this.props.dbId);
  }

  groupMenu() {
    this.setState({ groupManagerModal: true });
  }

  hideModals() {
    this.setState({ groupManagerModal: false });
  }

  render() {
    return (
      <figure className="figure img-card gallery-card rounded">
        <BsImage responsive src={this.props.thumbnail} alt="" onClick={this.props.onClick} />
        <h2 className="rounded" onClick={this.props.onClick}>{this.props.name}</h2>
        <ActionMenu
          simple={this.props.simple}
          group={this.props.group}
          setSlideshow={this.setSlideshow}
          onRemove={this.remove}
          groupConvert={this.groupConvert}
          groupMenu={this.groupMenu}
        />

        <Modal show={this.state.groupManagerModal} onHide={this.hideModals}>
          <Modal.Header closeButton>
            <Modal.Title>Group Users</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <GroupManager
              dbId={this.props.dbId}
              mongoId={this.props.mongoId}
              uid={this.props.uid}
              users={this.props.users}
              onRemove={this.remove}
            />
          </Modal.Body>
        </Modal>
      </figure>
    );
  }
}

GalleryCard.propTypes = {
  dbId: React.PropTypes.number.isRequired,
  name: React.PropTypes.string.isRequired,
  thumbnail: React.PropTypes.string,
  onClick: React.PropTypes.func.isRequired,
  onRemove: React.PropTypes.func.isRequired,
  group: React.PropTypes.bool,
  simple: React.PropTypes.bool,
  mongoId: React.PropTypes.string,
  uid: React.PropTypes.string,
  users: React.PropTypes.arrayOf(React.PropTypes.string)
};

GalleryCard.defaultProps = {
  thumbnail: '',
  simple: false,
  group: false,
  mongoId: '',
  uid: '',
  users: [],
};

export default GalleryCard;
