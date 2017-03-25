import React from 'react';
import { Col, Row, Grid, ListGroup, ListGroupItem, Button, Glyphicon, Form, FormControl } from 'react-bootstrap';
import Image from './image.jsx';
import Groups from '../models/groups';
import Host from '../models/host';
import GalleryCard from './gallerycard.jsx';
import { success, danger } from '../helpers/notifier';

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
    };

    // Bind functions
    this.refresh = this.refresh.bind(this);
    this.deleteGroup = this.deleteGroup.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
    this.handleTagChange = this.handleTagChange.bind(this);

    // Hook event to catch when a gallery is added
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
    dbId = (typeof dbId === 'string') ? dbId : this.props.dbId;
    // Null the group ID if we're looking at the base group
    if (dbId === '1') dbId = null;
    if (Host.isAuthed()) {
      Groups.get(dbId, (err, res, gallery) => {
        if (err) danger(`${err}: ${res}`);
        return Groups.expand(gallery, this.state.filter, (subgalleries, images) => {
          this.setState({
            subgalleries,
            images
          }, () => {
            console.log('Group refreshed', dbId);
          });
        });
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  deleteGroup(mongoId, id) {
    Groups.delete(mongoId, id, (err, msg) => {
      if (err) danger(msg);
      else {
        success(msg);
      }
    });
  }

  removeItem(id, fsDelete) {
    if (fsDelete) {
      Groups.deleteItem(id, () => true);
    } else {
      Groups.removeItem(this.props.dbId, id, () => true);
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
    return Groups.updateMetadata(this.props.dbId, metadata, (doc) => {
      if (!doc) return danger('Updating metadata failed');
      if (typeof field === 'string') this.setState({ newTag: '' });
      return success('Metadata updated');
    });
  }

  handleTagChange(event) {
    this.setState({ newTag: event.target.value });
  }

  render() {
    const groupDetails = (
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
        onClick={_ => this.props.onChange(subgallery._id)}
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
          {this.props.dbId !== '1' ? groupDetails : <br />}
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
  dbId: React.PropTypes.string.isRequired,
  onChange: React.PropTypes.func.isRequired
};

export default Group;
