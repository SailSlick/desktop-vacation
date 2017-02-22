#!groovy

node {
timeout(300) {
withCredentials([string(credentialsId: 'slack-token', variable: 'SLACKTOKEN')]) {

	stage ('Setup Environment') {
		step([$class: 'GitHubSetCommitStatusBuilder'])
		slackSend channel: '#github', color: '#F6FF00', message: "Build Started: $BRANCH_NAME #$BUILD_NUMBER $BUILD_URL", teamDomain: 'vedi-team', token: "$SLACKTOKEN"

		step([$class: 'WsCleanup', notFailBuild: true])

		checkout scm
	}

	try {
		stage ('Run Installer') {
			sh "$WORKSPACE/script/install.sh"
		}

		stage ('Setup Databases') {
			withCredentials([string(credentialsId: 'mongo-username', variable: 'DBUSER'), string(credentialsId: 'mongo-password', variable: 'DBPWD'), string(credentialsId: 'mongo-ssl-client', variable: 'DBSSLCLI'), string(credentialsId: 'mongo-ssl-server', variable: 'DBSSLSRV')
			]) {
				sh '$WORKSPACE/script/db/setup-mongo.sh $DBUSER $DBPWD $DBSSLCLI $DBSSLSRV'
			}

			sh 'cd $WORKSPACE/client && npm run makeDb'
		}

		stage ('Test Server') {
			withEnv(['SRVPORT=3001']) {
				sh 'cd $WORKSPACE/server && npm run lint'

				// Coverage runs tests
				sh 'cd $WORKSPACE/server && npm run coverage'
			}
		}

		stage ('Test Client') {
			sh 'cd $WORKSPACE/client && npm run lint'

			sh 'cd $WORKSPACE/client && npm run e2e-jenkins'

			sh 'cd $WORKSPACE/client && npm run test-jenkins'

			sh 'cd $WORKSPACE/client && npm run coverage'

			sh 'cd $WORKSPACE/client && npm run coverage-all'
		}

		// Delete symlinks now to avoid a cleanup crash
		sh 'rm -rf $WORKSPACE/client/app/thirdparty'

		currentBuild.result = 'SUCCESS'

		stage ('Generate Reports') {
			junit '**/*-tests.xml'

			step([$class: 'CheckStylePublisher', canComputeNew: false, defaultEncoding: '', healthy: '30', pattern: '', unHealthy: '200'])

			step([$class: 'CloverPublisher', cloverReportDir: 'coverage', cloverReportFileName: 'clover.xml', failingTarget: [conditionalCoverage: 45, methodCoverage: 25, statementCoverage: 45], healthyTarget: [conditionalCoverage: 80, methodCoverage: 70, statementCoverage: 80], unhealthyTarget: [conditionalCoverage: 55, methodCoverage: 40, statementCoverage: 55]])

			step([$class: 'GitHubCommitStatusSetter'])

			slackSend channel: '#github', color: '#00FF00', message: "Build Successful: $BRANCH_NAME #$BUILD_NUMBER $BUILD_URL", teamDomain: 'vedi-team', token: "$SLACKTOKEN"
		}

	} catch (err) {

		// Delete symlinks now to avoid a cleanup crash
		sh 'rm -rf $WORKSPACE/client/app/thirdparty'

		currentBuild.result = 'FAILURE'

		slackSend channel: '#github', color: '#FF0000', message: "Build FAILED: $BRANCH_NAME #$BUILD_NUMBER $BUILD_URL", teamDomain: 'vedi-team', token: "$SLACKTOKEN"

		throw err
	}
}
}
}
