import React, { Component,} from 'react';
import { View, Text, WebView, StyleSheet, Linking } from 'react-native';
import showdown from 'showdown';

import defaultHTML from './defaultHTML';


var script = `
;(function() {
var wrapper = document.createElement("div");
wrapper.id = "height-wrapper";
while (document.body.firstChild) {
    wrapper.appendChild(document.body.firstChild);
}
document.body.appendChild(wrapper);
var i = 0;
function updateHeight() {
    document.title = wrapper.clientHeight;
    window.location.hash = ++i;
}
updateHeight();
window.addEventListener("load", function() {
    updateHeight();
    setTimeout(updateHeight, 1000);
});
window.addEventListener("resize", updateHeight);
}());
`;

const styleEks = `
<script>
${script}
</script>
`;


class MarkdownView extends Component {

	static defaultShowdownOptions = {
		simplifiedAutoLink: true,
		strikethrough: true,
		tables: true,
	};

	state = {
		html: null,
		realContentHeight: this.props.minHeight,
	};

	converter = null;

	componentWillMount()
	{
		this._instantiateShowdownConverter(this.props.options);
		this._convertMarkdown(this.props.body);
	}

	componentWillReceiveProps(nextProps)
	{
		(this.props.options !== nextProps.options) && this._instantiateShowdownConverter(nextProps.options);
		(this.props.body !== nextProps.body) && this._convertMarkdown(nextProps.body);
	}

	_instantiateShowdownConverter(options)
	{
		this.converter = new showdown.Converter({...this.constructor.defaultShowdownOptions, ...options});
	}

	_convertMarkdown(markdownString)
	{
		this.setState({html: this.converter.makeHtml(markdownString)});
	}

	render() {

		const { pureCSS, automaticallyAdjustContentInsets, style,scrollEnabled, minHeight,injectedJavaScript,onNavigationStateChange} = this.props;

		return (
			<WebView
				ref={'WebView'}
				source={{
					html: defaultHTML
							.replace('$title', '')
							.replace('$body', this.state.html)
							.replace('$script', styleEks)
							.replace('$pureCSS', pureCSS)
							,
					baseUrl: 'about:blank',
				}}
				automaticallyAdjustContentInsets={ automaticallyAdjustContentInsets }
				scrollEnabled={ scrollEnabled }
				javaScriptEnabled={true}
				onNavigationStateChange={ this.onNavigationStateChange.bind(this) }
				style={[style, {height: Math.max(this.state.realContentHeight, minHeight)}]}
			/>
		);
	}

    onNavigationStateChange(navState) {
		if (navState.title) {
			const realContentHeight = parseInt(navState.title, 10) || 0; // turn NaN to 0
			this.setState({realContentHeight});
		}
		if (typeof this.props.onNavigationStateChange === "function") {
			this.props.onNavigationStateChange(navState);
		}
		if (navState.url) {
			this.refs.WebView.stopLoading();
			Linking.openURL(navState.url);
		}
	}
}

MarkdownView.propTypes = {
	title: React.PropTypes.string,
	body: React.PropTypes.string.isRequired,
	pureCSS: React.PropTypes.string,
	options: React.PropTypes.object,
	automaticallyAdjustContentInsets: React.PropTypes.bool,
	scrollEnabled: React.PropTypes.bool,
	style: View.propTypes.style,
	injectedJavaScript: React.PropTypes.string,
	minHeight: React.PropTypes.number,
	onNavigationStateChange: React.PropTypes.func,
};

MarkdownView.defaultProps = {
	title: '',
	pureCSS: '',
	options: {},
	style: {
		flex: 1
	},
};

module.exports = MarkdownView;
