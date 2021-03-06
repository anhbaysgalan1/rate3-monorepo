import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Blockies from 'react-blockies';
import { observer, inject } from 'mobx-react';

const styles = (theme) => {
  return ({
    container: {
      overflow: 'hidden',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};

const ProfilePic = inject('RootStore')(observer((props) => {
  const seed = props.RootStore.computedUserAddr;
  const { classes } = props;
  return (
    <div className={classes.container}>
      <Blockies
        className={classes.icon}
        seed={props.seed ? props.seed.toString() : seed}
        scale={props.size - 1}
        size={props.size}
      />
    </div>
  );
}));

ProfilePic.propTypes = {

};

export default withStyles(styles)(ProfilePic);
