import React from 'react';
import { MenuItem, Glyphicon, Image as BsImage, Modal } from 'react-bootstrap';
import Slideshow from '../helpers/slideshow-client';
import GroupManager from './groupManager.jsx';

const ActionMenu = ({ simple, group, setSlideshow, onRemove, switchG, groupMenu }) => {
  if (simple) {
    return <figcaption style={{ display: 'none' }} />;
  }
  let gMenu = (<MenuItem divider />);
  if (group) {
    gMenu = (
      <MenuItem onClick={groupMenu}>
        <Glyphicon glyph="list" />Group Manager
      </MenuItem>
    );
  }
  return (
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
        {gMenu}
        <MenuItem onClick={switchG}>
          <Glyphicon glyph="transfer" />Switch to Group
        </MenuItem>
      </div>
    </figcaption>
  );
};

ActionMenu.propTypes = {
  simple: React.PropTypes.bool.isRequired,
  group: React.PropTypes.bool.isRequired,
  setSlideshow: React.PropTypes.func.isRequired,
  onRemove: React.PropTypes.func.isRequired,
  switchG: React.PropTypes.func.isRequired,
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
    this.switchG = this.switchG.bind(this);
    this.groupMenu = this.groupMenu.bind(this);
    this.hideModals = this.hideModals.bind(this);
  }

  setSlideshow() {
    Slideshow.set(this.props.dbId);
  }

  remove() {
    this.props.onRemove(this.props.dbId);
  }

  switchG() {
    this.props.groupSwitch(this.props.name, this.props.dbId);
  }

  groupMenu() {
    console.log("Switching to group manager modal");
    this.setState({ groupManagerModal: true });
  }

  hideModals() {
    this.setState({ groupManagerModal: false });
  }

  render() {
    return (
      <figure className="figure img-card gallery-card rounded" onClick={this.props.onClick}>
        <BsImage responsive src={this.props.thumbnail} alt="" />
        <h2 className="rounded">{this.props.name}</h2>
        <ActionMenu
          simple={this.props.simple}
          group={this.props.group}
          setSlideshow={this.setSlideshow}
          onRemove={this.remove}
          switchG={this.switchG}
          groupMenu={_ => this.groupMenu()}
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
  groupSwitch: React.PropTypes.func.isRequired,
  group: React.PropTypes.bool,
  simple: React.PropTypes.bool,
  mongoId: React.PropTypes.string,
  uid: React.PropTypes.string,
  users: React.PropTypes.arrayOf(React.PropTypes.string)
};

GalleryCard.defaultProps = {
  thumbnail: '',
  simple: false,
  group: true,
  mongoId: '',
  uid: '',
  users: [],
};

export default GalleryCard;
