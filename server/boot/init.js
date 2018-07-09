'use strict';

module.exports = function(app, cb) {
  const Container = app.models.Container;
  const pluginsContainerName = 'plugins';

  Container.getContainer(pluginsContainerName, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        Container.createContainer({
          name: pluginsContainerName,
        }, (err) => {
          if (err) return cb(err);
          console.log('Plugins container created.');
          cb();
        });
      } else {
        cb(err);
      }
    } else {
      console.log('Plugins container already created.');
      cb();
    }
  });
};
