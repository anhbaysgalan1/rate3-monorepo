import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import { buttonShadow, buttonHoverShadow } from '../constants/colors';

const styles = theme => ({
  button: {
    width: '100%',
    height: '100%',
    minHeight: '100%',
    fontSize: '1.5rem',
    // fontWeight: 'bold',
    borderRadius: '50px',
    color: 'white',
    boxShadow: buttonShadow,
    '&:hover': {
      boxShadow: buttonHoverShadow,
    },
  },
  whitespaces: {
    whiteSpace: 'pre',
  },
  disabled: {
    boxShadow: `${buttonShadow} !important`,
    color: 'white !important',
  },
  root: {

  },
});

const BlueButton = (props) => {
  let { classes } = props;
  return (
    <Button
      variant="contained"
      size="large"
      color="primary"
      disabled={props.disabled}
      className={classes.button}
      classes={{
        disabled: props.classes.disabled ? props.classes.disabled : classes.disabled,
        root: props.classes.root ? props.classes.root : classes.button,
      }}
      onClick={props.handleClick}
      style={{ fontWeight: props.fontWeight, fontSize: props.fontSize, lineHeight: props.lineHeight, letterSpacing: '0.05em' }}
    >
      {props.buttonText}{props.buttonIcon &&
        <div className={classes.whitespaces}>  <img style={{ height: props.iconHeight }} src={props.buttonIcon} alt="ether" /></div>
      }
    </Button>
  );
};

BlueButton.propTypes = {
  classes: PropTypes.object.isRequired,
  // theme: PropTypes.object.isRequired,
};


export default withStyles(styles)(BlueButton);
