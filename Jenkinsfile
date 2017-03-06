#!groovy

node {
timeout(300) {
withCredentials([string(credentialsId: 'slack-token', variable: 'SLACKTOKEN')]) {

	stage ('Setup Environment') {
		step([$class: 'GitHubSetCommitStatusBuilder'])
		slackSend channel: '#github', color: '#F6FF00', message: "Build Started: $BRANCH_NAME #$BUILD_NUMBER $BUILD_URL", teamDomain: 'vedi-team', token: "$SLACKTOKEN"

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

			sh 'cd $WORKSPACE/client && npm run test-jenkins'

			sh 'cd $WORKSPACE/client && npm run coverage'

			sh 'cd $WORKSPACE/client && npm run coverage-all'
		}

		currentBuild.result = 'SUCCESS'

		stage ('Generate Reports') {
			junit '**/*-tests.xml'

			step([$class: 'CheckStylePublisher', canComputeNew: false, defaultEncoding: '', healthy: '1', pattern: '', unHealthy: '15'])

			step([$class: 'CloverPublisher', cloverReportDir: 'coverage', cloverReportFileName: 'clover.xml', failingTarget: [conditionalCoverage: 40, methodCoverage: 50, statementCoverage: 50], healthyTarget: [conditionalCoverage: 70, methodCoverage: 85, statementCoverage: 85], unhealthyTarget: [conditionalCoverage: 50, methodCoverage: 65, statementCoverage: 65]])

			step([$class: 'GitHubCommitStatusSetter'])

			slackSend channel: '#github', color: '#00FF00', message: "Build Successful: $BRANCH_NAME #$BUILD_NUMBER $BUILD_URL", teamDomain: 'vedi-team', token: "$SLACKTOKEN"
		}

		// Delete symlinks now to avoid a cleanup crash
		sh 'sudo rm -rvf $WORKSPACE/client/app/thirdparty'

		step([$class: 'WsCleanup', notFailBuild: true])

	} catch (err) {

		currentBuild.result = 'FAILURE'

		slackSend channel: '#github', color: '#FF0000', message: "Build FAILED: $BRANCH_NAME #$BUILD_NUMBER $BUILD_URL", teamDomain: 'vedi-team', token: "$SLACKTOKEN"

		// Delete symlinks now to avoid a cleanup crash
		sh 'sudo rm -rvf $WORKSPACE/client/app/thirdparty'

		step([$class: 'WsCleanup', notFailBuild: true])

		throw err
	}
}
}
}
