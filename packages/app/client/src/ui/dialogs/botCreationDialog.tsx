import * as React from 'react';
import { IBot } from '@bfemulator/app-shared';
import { css } from 'glamor';

import * as Fonts from '../styles/fonts';
import * as Colors from '../styles/colors';
import * as BotActions from '../../data/action/botActions';
import * as NavBarActions from '../../data/action/navBarActions';
import * as Constants from '../../constants';
import { CommandService } from '../../platform/commands/commandService';
import store from '../../data/store';
import { PrimaryButton, TextInputField } from '../widget';
import { DialogService } from './service/index';
import { ActiveBotHelper } from '../helpers/activeBotHelper';
import { Row, RowAlignment, RowJustification, Column, GenericDocument } from '../layout';

const CSS = css({
  backgroundColor: Colors.EDITOR_TAB_BACKGROUND_DARK,

  '& h2': {
    fontWeight: 200,
    fontSize: '20px'
  },

  '& .multi-input-row > *': {
    marginLeft: '8px'
  },

  '& .multi-input-row > *:first-child': {
    marginLeft: 0
  }
});

interface IBotCreationDialogState {
  bot: IBot;
  touchedName: boolean;
}

export default class BotCreationDialog extends React.Component<{}, IBotCreationDialogState> {
  constructor(props, context) {
    super(props, context);

    this.onChangeEndpoint = this.onChangeEndpoint.bind(this);
    this.onChangeAppId = this.onChangeAppId.bind(this);
    this.onChangeAppPw = this.onChangeAppPw.bind(this);
    this.onChangeLocale = this.onChangeLocale.bind(this);
    this.onChangeName = this.onChangeName.bind(this);
    this.onConnect = this.onConnect.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onSelectFolder = this.onSelectFolder.bind(this);

    this.state = {
      bot: { botUrl: '', msaAppId: '', msaPassword: '', locale: '', botName: '', projectDir: '' },
      touchedName: false
    };

    // get new bot from main
    CommandService.remoteCall('bot:new')
      .then(bot => {
        this.setState({ ...this.state, bot });
      })
      .catch(err => console.error('Error getting a new bot object from the server: ', err));
  }

  onChangeEndpoint(e) {
    const bot = { ...this.state.bot, botUrl: e.target.value };
    this.setState({ bot });
  }

  onChangeAppId(e) {
    const bot = { ...this.state.bot, msaAppId: e.target.value };
    this.setState({ bot });
  }

  onChangeAppPw(e) {
    const bot = { ...this.state.bot, msaPassword: e.target.value };
    this.setState({ bot });
  }

  onChangeLocale(e) {
    const bot = { ...this.state.bot, locale: e.target.value };
    this.setState({ bot });
  }

  onChangeName(e) {
    const bot = { ...this.state.bot, botName: e.target.value };
    this.setState({ bot, touchedName: true });
  }

  onCancel(e) {
    DialogService.hideDialog();
  }

  onConnect(e) {
    const bot = {
      ...this.state.bot,
      botUrl: this.state.bot.botUrl.trim(),
      msaAppId: this.state.bot.msaAppId.trim(),
      msaPassword: this.state.bot.msaPassword.trim(),
      locale: this.state.bot.locale.trim(),
      botName: this.state.bot.botName.trim(),
      projectDir: this.state.bot.projectDir.trim()
    };

    ActiveBotHelper.confirmAndCreateBot(bot)
      .then(() => DialogService.hideDialog())
      .catch(err => console.error('Error during confirm and create bot.'))
  }

  onSelectFolder(e) {
    const dialogOptions = {
      title: 'Choose a folder for your bot',
      buttonLabel: 'Choose folder',
      properties: ['openDirectory', 'promptToCreate']
    };

    CommandService.remoteCall('shell:showOpenDialog', dialogOptions)
      .then(path => {
        if (path) {
        const bot = { ...this.state.bot, projectDir: path };
        this.setState({ bot });

        // use bot directory as bot name if name hasn't been touched
        if (!this.state.touchedName && path)
          CommandService.remoteCall('path:basename', path)
            .then(dirName => {
              const bot = { ...this.state.bot, botName: dirName };
              this.setState({ bot });
            });
          }
      })
      .catch(err => console.log('User cancelled choosing a bot folder: ', err));
  }

  render(): JSX.Element {
    const requiredFieldsCompleted = this.state.bot
      && this.state.bot.botUrl
      && this.state.bot.botName
      && this.state.bot.projectDir;

    return (
      <GenericDocument style={ CSS }>
        <Column>
          <h2>Add a bot</h2>
          <TextInputField value={ this.state.bot.botUrl } onChange={ this.onChangeEndpoint } label={ 'Endpoint URL' } required={ true } />
          <Row className="multi-input-row">
            <TextInputField value={ this.state.bot.msaAppId } onChange={ this.onChangeAppId } label={ 'MSA app ID (optional)' } />
            <TextInputField value={ this.state.bot.msaPassword } onChange={ this.onChangeAppPw } label={ 'MSA app password (optional)' } type={ 'password' } />
            <TextInputField value={ this.state.bot.locale } onChange={ this.onChangeLocale } label={ 'Locale (optional)' } />
          </Row>
          <Row className="multi-input-row" align={ RowAlignment.Center }>
            <TextInputField value={ this.state.bot.botName } onChange={ this.onChangeName } label={ 'Bot name' } required={ true } />
            <TextInputField value={ this.state.bot.projectDir } label={ 'Project folder' } readOnly={ true } required={ true } />
            <PrimaryButton text='Browse' onClick={ this.onSelectFolder } className="browse-button" />
          </Row>
          <Row className="multi-input-row" justify={ RowJustification.Right }>
            <PrimaryButton text='Cancel' onClick={ this.onCancel } className="cancel-button" />
            <PrimaryButton text='Connect' onClick={ this.onConnect }  disabled={ !requiredFieldsCompleted } className="connect-button" />
          </Row>
        </Column>
      </GenericDocument>
    );
  }
}
