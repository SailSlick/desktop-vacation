#!groovy

node {
timeout(300) {
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

		stage ('Set up Tingo Database') {
			sh 'cd $WORKSPACE/client && npm run makeDb'
		}

		stage ('Run Client E2E Tests') {
			sh 'cd $WORKSPACE/client && npm run e2e-jenkins'
		}

		stage ('Test Client') {
			sh 'cd $WORKSPACE/client && npm run test-jenkins'
		}

		stage ('Report Client Coverage') {
			sh 'cd $WORKSPACE/client && npm run coverage-jenkins'
		}

		stage ('Test Server') {
			withEnv(['SRVPORT=3001']) {
				sh 'cd $WORKSPACE/server && npm run test'
			}
		}

		// Delete symlinks now to avoid a crash
		sh 'rm -rf $WORKSPACE/client/app/thirdparty'

		currentBuild.result = 'SUCCESS'

		stage ('Generate Reports') {
			junit 'client/tests.xml'

			publishHTML([allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true, reportDir: 'client/coverage', reportFiles: 'index.html', reportName: 'Client Coverage'])

			step([$class: 'GitHubCommitStatusSetter'])

			slackSend channel: '#github', color: '#00FF00', message: "Build Successful: $BRANCH_NAME #$BUILD_NUMBER $BUILD_URL", teamDomain: 'vedi-team', token: "$SLACKTOKEN"
		}

	} catch (err) {

		// Delete symlinks now to avoid a crash
		sh 'rm -rf $WORKSPACE/client/app/thirdparty'

		currentBuild.result = 'FAILURE'

		slackSend channel: '#github', color: '#FF0000', message: "Build FAILED: $BRANCH_NAME #$BUILD_NUMBER $BUILD_URL", teamDomain: 'vedi-team', token: "$SLACKTOKEN"

		throw err
	}
}
}
}
