import React from 'react';
import { Grid, Row, Dropdown, MenuItem, InputGroup, Col, Glyphicon, Form, FormControl, Button } from 'react-bootstrap';

export default class GalleryBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    if (!this.props.showing) {
      return <span />;
    }
    return (
      <Grid>
        <Row>
          <Col xs={2} md={2}>
            <h4>Subgalleries: {this.props.numSubgalleries}</h4>
          </Col>
          <Col xs={2} md={2}>
            <h4>Images: {this.props.numImages}</h4>
          </Col>
          <Col xs={1} md={1}>
            <Dropdown pullRight id="tags-dropdown">
              <Dropdown.Toggle>
                Tags
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {this.props.tags.map(tag => (
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  <MenuItem key={tag} >
                    <InputGroup>
                      <p colSpan="2">{tag}</p>
                      <InputGroup.Button>
                        <Button
                          bsStyle="link"
                          onClick={e => e.preventDefault() ||
                            this.props.updateMetadata(tag, true)}
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
          <Col xs={3} md={3}>
            <Form
              horizontal
              onSubmit={e => e.preventDefault() ||
                this.props.updateMetadata(e.target.newTag.value, false)}
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
          <Col xs={4} md={4}>
            <h4>Rating:
              {[1, 2, 3, 4, 5].map(val => (
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                <a
                  key={val} onClick={e => e.preventDefault() ||
                    this.props.updateMetadata(val, false)}
                >
                  <Glyphicon glyph={this.props.rating >= val ? 'star' : 'star-empty'} />
                </a>
              ))
              }
            </h4>
          </Col>
        </Row>
      </Grid>
    );
  }
}

GalleryBar.propTypes = {
  updateMetadata: React.PropTypes.func.isRequired,
  rating: React.PropTypes.number.isRequired,
  tags: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  numImages: React.PropTypes.number.isRequired,
  numSubgalleries: React.PropTypes.number.isRequired,
  showing: React.PropTypes.bool.isRequired,
};
