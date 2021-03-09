import { app, BrowserWindow } from 'electron';
import Main from './main';

// Initialisation of the whole application starts here.
Main.main(app, BrowserWindow);