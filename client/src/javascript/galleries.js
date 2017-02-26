import $ from 'jquery';
import Templates from './templates';
import DbConn from './db';
import Wallpaper from './wallpaper-client';
import Slides from './slideshow-client';
import Notification from './notification';

const notify = Notification.show;

let gallery_db;
let Images = null;

const Galleries = {
  baseName: 'Sully'.concat('_all'),
  currentGallery: '',

  addGalleryName: () => {
    $('#hover-content').html(Templates.generate('gallery-get-name', {})).show();
    $('#hover-content form').submit((event) => {
      event.preventDefault();
      Galleries.add($('#gallery-name').val(), () => true);
      $('#hover-content').html('').hide();
    });
    $('#hover-content .btn-danger').one('click', () => $('#hover-content').html('').hide());
  },

  add: (name, next) => {
    console.log(`Adding gallery ${name}`);
    if (name.length === 0) {
      const msg = 'Empty name';
      console.error(msg);
      notify(msg, 'alert-danger');
      next(msg);
      return;
    } else if (name === Galleries.baseName) {
      const msg = 'Attempting to add base gallery';
      console.error(msg);
      notify(msg, 'alert-danger');
      next(msg);
      return;
    }
    gallery_db.findOne({ name }, (found_gallery) => {
      if (found_gallery === null) {
        const doc = {
          name,
          tags: [],
          subgallaries: [],
          images: []
        };
        gallery_db.insert(doc, (inserted_gallery) => {
          gallery_db.findOne({ name: Galleries.baseName }, (base_gallery) => {
            if (base_gallery === null) {
              const msg = `${Galleries.baseName} not found.`;
              console.error(msg);
              notify(msg, 'alert-danger');
              next(msg);
              return;
            }
            base_gallery.subgallaries.push(inserted_gallery.$loki);
            gallery_db.updateOne(
              { name: Galleries.baseName },
              base_gallery, () => {}
            );
            notify('Gallery created!');
          });
          if (Galleries.currentGallery.length !== 0) {
            Galleries.addSubGallery(inserted_gallery, () => {
              next();
              Galleries.view(Galleries.currentGallery);
            });
          } else {
            next();
            Galleries.view(Galleries.currentGallery);
          }
        });
      } else if (Galleries.currentGallery.length === 0) {
        const msg = `Error adding ${name}, gallery already exists`;
        console.log(msg);
        notify(msg, 'alert-danger');
        next(msg);
      } else {
        Galleries.addSubGallery(found_gallery, (err) => {
          if (err) console.error(err);
          Galleries.view(Galleries.currentGallery);
          next(err);
        });
      }
    });
  },

  addSubGallery: (child_gallery, next) => {
    console.log(`Adding ${child_gallery.name} to ${Galleries.currentGallery}`);
    if (Galleries.currentGallery === Galleries.baseName) {
      next('Parent is baseName');
    } else if (Galleries.currentGallery === child_gallery.name) {
      next('Adding child gallery to itself');
    } else {
      gallery_db.findOne({ name: Galleries.currentGallery }, (parent_gallery) => {
        if (parent_gallery === null) {
          next(`${Galleries.currentGallery} does not exist`);
          return;
        }
        if ($.inArray(child_gallery.$loki, parent_gallery.subgallaries) !== -1) {
          const msg = `${child_gallery.name} is already a subgallery!`;
          notify(msg);
          next(msg);
          return;
        }
        parent_gallery.subgallaries.push(child_gallery.$loki);
        gallery_db.updateOne({ name: Galleries.currentGallery }, parent_gallery, () => {
          next();
        });
      });
    }
  },

  addItem: (name, image_id, next) => {
    console.log(`Adding image_id ${image_id} to gallery ${name}`);
    gallery_db.findOne({ name }, (gallery) => {
      if (gallery === null) {
        const msg = 'Cannot find gallery';
        console.error(msg);
        notify(msg, 'alert-danger');
        next(msg);
      } else if ($.inArray(image_id, gallery.images) === -1) {
        gallery.images.push(image_id);
        gallery_db.updateOne({ name }, gallery, () => {});
        notify('Item added!');
        next();
      } else {
        const msg = 'Can\'t add a duplicate image';
        console.error(msg);
        notify(msg, 'alert-danger');
        next(msg);
      }
    });
  },

  forAllSubgalleries: (name, next) => {
    gallery_db.findOne({ name }, (gallery) => {
      if (gallery === null) {
        console.error(`${name} is an invalid gallery`);
        return;
      }
      gallery.subgallaries.forEach((id, index) => {
        gallery_db.findOne({ $loki: id }, (subGallery) => {
          if (subGallery !== null) {
            next(subGallery, index);
          } else {
            console.error(`Invalid subgallery in ${id}`);
          }
        });
      });
    });
  },

  getThumbnail: (name, next) =>
    gallery_db.findOne({ name }, (gallery) => {
      if (gallery !== null) {
        if (gallery.images.length !== 0) {
          return Images.image_db.findOne({ $loki: gallery.images[0] },
            (image) => {
              if (image !== null) {
                return next(image.location);
              }
              return next();
            }
          );
        }
      }
      return next();
    }),

  remove: (name, next) => {
    console.log(`Removing gallery: ${name}`);
    if (name !== Galleries.baseName) {
      gallery_db.findOne({ name }, (gallery) => {
        if (gallery == null) {
          next('Gallery does not exist');
        } else if (Galleries.currentGallery.length !== 0) {
          gallery_db.findOne(
            {
              name: Galleries.currentGallery,
              subgallaries: { $contains: gallery.$loki }
            }, (ref) => {
            ref.subgallaries = ref.subgallaries.filter(v => v !== gallery.$loki);
            gallery_db.updateOne(
              { $loki: ref.$loki },
              ref.subgallaries,
              r => console.log(`- ${r.name} no longer contains reference to gallery`)
            );
            next();
          });
        } else {
          gallery_db.findMany({ subgallaries: { $contains: gallery.$loki } }, (references) => {
            references.forEach((ref, _i) => {
              ref.subgallaries = ref.subgallaries.filter(v => v !== gallery.$loki);
              gallery_db.updateOne(
                { $loki: ref.$loki },
                ref.subgallaries,
                r => console.log(`- ${r.name} no longer contains reference to gallery`)
              );
            });
          });
          gallery_db.removeOne({ name }, () => {
            notify('Gallery removed!');
            next();
          });
        }
      });
    } else {
      next('Tried to delete base gallery');
    }
  },

  removeItem: (name, id, next) => {
    if (name !== Galleries.baseName) {
      gallery_db.findOne({ name }, (gallery) => {
        if (gallery === null) {
          const msg = `${name} not found`;
          notify(msg, 'alert-danger');
          next(msg);
        } else {
          gallery.images = gallery.images.filter(i => i !== id);
          gallery_db.updateOne({ name }, gallery, () => {
            notify('Item removed!');
            next();
          });
        }
      });
    }
  },

  removeAllItems: (path, next) => {
    console.log(`Attempting to remove ${path} from all galleries`);
    return next(Images.image_db.findOne({ location: path }, (image) => {
      const id = image.$loki;
      gallery_db.findMany({ images: { $contains: id } }, (galleries) => {
        galleries.forEach((gallery) => {
          if (gallery === null) {
            console.error(`${name} not found`);
          } else if (gallery.name !== Galleries.baseName) {
            gallery.images = gallery.images.filter(i => i !== id);
            gallery_db.updateOne({ name }, gallery, () => {
              Galleries.view();
              notify('Item removed!');
            });
          }
        });
      });
    }));
  },

  pickGallery: (path) => {
    $('#hover-content').html(Templates.generate('3-col-view', {})).show();
    $('#hover-content .row').addClass('inverted centered padded');
    $('#hover-content').one('click', () =>
      $('#hover-content').html('').hide()
    );

    Galleries.forAllSubgalleries(Galleries.baseName, (subGallery, index) => {
      const col = index % 3;
      const selector = `#hover-content .view-col-${col}`;
      Galleries.getThumbnail(subGallery.name, (thumbnail) => {
        $(selector).append(Templates.generate('gallery-item', {
          name: subGallery.name,
          thumbnail
        }));
        $(`${selector} .gallery-card:last-child`).one('click', () => {
          Galleries.addItem(subGallery.name, path, () => {
            $('#hover-content').html('').hide();
          });
        });

        // Remove the ... menus
        $('#hover-content figcaption').remove();
      });
    });
  },

  forAllImages: (name, next) => {
    gallery_db.findOne({ name }, (gallery) => {
      if (gallery === null) {
        console.error(`${name} is an invalid gallery`);
      } else {
        gallery.images.forEach((id, index) => {
          Images.image_db.findOne({ $loki: id }, (image) => {
            if (image !== null) {
              next(image, index);
            } else {
              console.error(`${name} contains an invalid image: ${id}`);
            }
          });
        });
      }
    });
  },

  view: (name) => {
    gallery_db.save(() => {});
    if (typeof name === 'undefined' || typeof name.type !== 'undefined' || name.length === 0) {
      name = Galleries.baseName;
    } else {
      Galleries.currentGallery = name;
    }
    let col = -1;
    $('#main-content').html(Templates.generate('3-col-view', {}));

    Galleries.forAllSubgalleries(name, (subGallery, index) => {
      col = index % 3;
      const selector = `#main-content .view-col-${col}`;
      Galleries.getThumbnail(subGallery.name, (thumbnail) => {
        $(selector).append(Templates.generate('gallery-item', {
          name: subGallery.name,
          thumbnail
        }));
        $(selector).click(() => {
          Galleries.view(subGallery.name);
        });
        $(`${selector} .img-card:last-child .btn-gallery-remove`).click(() => Galleries.remove(subGallery.name, (err) => {
          if (err) console.err(err);
          Galleries.view(Galleries.currentGallery);
        }));
        $(`${selector} .img-card:last-child .btn-gallery-slideshow`).click(() => Slides.setSlideshow(subGallery.name));
      });
    });
    let adj = 0;
    if (col !== -1) {
      adj = col + 1;
    }

    Galleries.forAllImages(name, (image, index) => {
      col = (index + adj) % 3;
      const path = image.location;
      const selector = `#main-content .view-col-${col}`;
      $(selector).append(Templates.generate('image-gallery-item', { src: path, id: index }));
      $(`${selector} .img-card:last-child .btn-img-remove`).click(() => Galleries.removeItem(name, image.$loki, (err) => {
        if (err) console.error(err);
        Galleries.view();
      }));
      $(`${selector} .img-card:last-child .btn-img-setwp`).click(() => Wallpaper.set(path));
      $(`${selector} .img-card:last-child .btn-img-addtogallery`).click(() => Galleries.pickGallery(image.$loki));
      $(`${selector} .img-card:last-child img`).click(() => Images.expand(path));
    });
  },

  setImageModule: (images_module) => { Images = images_module; }
};

// Events
$(document).on('vacation_loaded', () => {
  gallery_db = new DbConn('galleries');
});

export default Galleries;
