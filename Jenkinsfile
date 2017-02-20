#!groovy

node {
timeout(120) {
withCredentials([string(credentialsId: 'slack-token', variable: 'SLACKTOKEN')]) {

	stage ('Alert Github and Slack') {
		step([$class: 'GitHubSetCommitStatusBuilder'])
		slackSend channel: '#github', color: '#F6FF00', message: "Build Started: $BRANCH_NAME #$BUILD_NUMBER $BUILD_URL", teamDomain: 'vedi-team', token: "$SLACKTOKEN"
	}

	stage('Setup cleanup') {
		step([$class: 'WsCleanup', notFailBuild: true])
	}

	stage ('Clone Repository') {
		checkout scm
	}

	try {
		stage ('Install Dependencies') {
			sh "$WORKSPACE/script/install.sh"
		}

		stage ('Set up Mongo Database') {
			withCredentials([string(credentialsId: 'mongo-username', variable: 'DBUSER'), string(credentialsId: 'mongo-password', variable: 'DBPWD'), string(credentialsId: 'mongo-ssl-client', variable: 'DBSSLCLI'), string(credentialsId: 'mongo-ssl-server', variable: 'DBSSLSRV')]) {
				sh '$WORKSPACE/script/db/setup-mongo.sh $DBUSER $DBPWD $DBSSLCLI $DBSSLSRV'
			}
		}

		stage ('Run Client E2E Tests') {
			sh 'cd $WORKSPACE/client && npm run e2e'
		}

		stage ('Test Client and Report Coverage') {
			sh 'cd $WORKSPACE/client && npm run coverage'
		}

		stage ('Run Server Tests') {
			sh 'cd $WORKSPACE/server && npm run test'
		}

		currentBuild.result = 'SUCCESS'

		stage ('Generate Reports') {
			junit 'tests.xml'

			step([$class: 'GitHubCommitStatusSetter'])

			slackSend channel: '#github', color: '#00FF00', message: "Build Successful: $BRANCH_NAME #$BUILD_NUMBER $BUILD_URL", teamDomain: 'vedi-team', token: "$SLACKTOKEN"
		}

	} catch (err) {

		currentBuild.result = 'FAILURE'

		slackSend channel: '#github', color: '#FF0000', message: "Build FAILED: $BRANCH_NAME #$BUILD_NUMBER $BUILD_URL", teamDomain: 'vedi-team', token: "$SLACKTOKEN"

		throw err
	}
}
}
}
